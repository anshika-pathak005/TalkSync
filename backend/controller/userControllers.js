// so first the logic for registration of the user

import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../Modals/userModel.js";
import { generateAccessToken, generateRefreshToken } from "../config/generateToken.js";
import { isValidEmail, isNonEmptyString } from "../utils/validators.js";

// scoped to /api/user so the cookie isn't sent on every single API request,
// only on the login/refresh/logout endpoints that actually need it
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/user",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days — mirrors the refresh JWT's own expiry
};

const setRefreshCookie = (res, user) => {
    const refreshToken = generateRefreshToken(user._id, user.tokenVersion);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
};

// named export of registerUser function
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, pic } = req.body;

    // checking if all the fields are present
    if (!name || !email || !password) { //cause pic is optional
        res.status(400);
        throw new Error("Please enter all the fields");
    }

    if (!isNonEmptyString(name, { max: 100 })) {
        res.status(400);
        throw new Error("Please enter a valid name");
    }

    if (!isValidEmail(email)) {
        res.status(400);
        throw new Error("Please enter a valid email address");
    }

    if (typeof password !== "string" || password.length < 6) {
        res.status(400);
        throw new Error("Password must be at least 6 characters");
    }

    // check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }

    // create the user after all the check
    const user = await User.create({
        name,
        email,
        password,
        pic,
    });

    // sent success status
    if (user) {
        setRefreshCookie(res, user);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            // short-lived access token — the refresh token went out as an
            // httpOnly cookie above, never in this body
            token: generateAccessToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error("Failed to create the user");
    }

});

// named export of authUser function
export const authUser = asyncHandler(async (req, res) => {
    // ṭake email and password from req body
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("Please enter both email and password");
    }

    // check for user email in db
    const user = await User.findOne({ email });

    // if user found then check for password match
    if (user && (await user.matchPassword(password))) {
        setRefreshCookie(res, user);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            // short-lived access token — the refresh token went out as an
            // httpOnly cookie above, never in this body
            token: generateAccessToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error("Invalid Email or Password");
    }
});

// exchanges the httpOnly refresh cookie for a fresh access token. Also
// re-issues the refresh cookie (sliding expiry) but does NOT bump
// tokenVersion — that's reserved for logout, since bumping it on every
// refresh would log a user out of one tab the moment another tab refreshed
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        res.status(401);
        throw new Error("No refresh token provided");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        res.status(401);
        throw new Error("Refresh token invalid or expired");
    }

    const user = await User.findById(decoded.id);

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
        res.status(401);
        throw new Error("Refresh token no longer valid");
    }

    setRefreshCookie(res, user);
    res.json({ token: generateAccessToken(user._id) });
});

// clears the refresh cookie and bumps tokenVersion, which invalidates
// every outstanding refresh token for this user immediately (other tabs/
// devices will be forced through a real login on their next refresh)
export const logoutUser = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            await User.findByIdAndUpdate(decoded.id, { $inc: { tokenVersion: 1 } });
        } catch (error) {
            // already invalid/expired — nothing to invalidate, just clear the cookie below
        }
    }

    res.clearCookie("refreshToken", { path: "/api/user" });
    res.json({ message: "Logged out" });
});

// fetch all the users with particular name or email
export const allUsers = asyncHandler(
    async (req, res) => {
        // Build a MongoDB query object based on the search parameter received in the URL.
        // Here, we are using MongoDB's query language (MQL), where operators like
        // $or and $regex are used to define search conditions.
        //
        // - $or: Returns documents that satisfy at least one of the given conditions.
        // - $regex: Performs pattern matching, similar to SQL's LIKE operator.
        // - $options: "i": Makes the search case-insensitive.
        //
        // This query searches for users whose 'name' OR 'email' contains the search
        // keyword provided in the request (e.g., /api/user?search=john).
        //
        // If no search parameter is provided, an empty object {} is used, which means
        // no filtering is applied and all documents are eligible to be returned.
        const keyword = req.query.search ?
            {
                // search in db with regex for name or email
                $or: [
                    { name: { $regex: req.query.search, $options: "i" } },
                    { email: { $regex: req.query.search, $options: "i" } },
                ],
            } : {};

        //send all the users except the logged in user by using $ne operator (not equal) in the query
        const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
        // req.user._id - this is coming from the auth middleware
        res.send(users);
    }
)

// update password of logged-in user
export const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // 1. validation
    if (!oldPassword || !newPassword) {
        res.status(400);
        throw new Error("Old password and new password are required");
    }

    if (oldPassword === newPassword) {
        res.status(400);
        throw new Error("New password must be different from old password");
    }

    // 2. get logged-in user from DB
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // 3. check if old passwork provided is correct by the user only then update
    const isMatch = await user.matchPassword(oldPassword);

    if (!isMatch) {
        res.status(401);
        throw new Error("Old password is incorrect");
    }

    // 4. update password
    user.password = newPassword;

    // invalidate any refresh tokens issued before this change — if
    // someone had a stolen one, changing the password now locks them out too
    user.tokenVersion += 1;

    // 5. save user → pre('save') will hash password
    await user.save();

    res.status(200).json({
        message: "Password updated successfully",
    });
});


// to update the picture of the user
export const updateProfilePic = asyncHandler(async (req, res) => {
    const { pic } = req.body;

    // validation
    if (!pic) {
        res.status(400);
        throw new Error("Profile picture is required");
    }

    // update user pic without triggering pre-save middleware
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { pic },
        { new: true } // return the updated document
    );

    if (!updatedUser) {
        res.status(404);
        throw new Error("User not found");
    }

    // send updated user back
    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        pic: updatedUser.pic,
        token: generateAccessToken(updatedUser._id),
    });
});
