// so first the logic for registration of the user

import asyncHandler from "express-async-handler";
import User from "../Modals/userModel.js";
import { generateToken } from "../config/generateToken.js";

// named export of registerUser function
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, pic } = req.body;

    // checking if all the fields are present
    if (!name || !email || !password) { //cause pic is optional
        res.status(400);
        throw new Error("Please enter all the fields");
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
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            // also send the JWT token to user in response
            token: generateToken(user._id),
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

    // check for user email in db
    const user = await User.findOne({ email });

    // if user found then check for password match
    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            // also send the JWT token to user in response
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error("Invalid Email or Password");
    }
});

// fetch all the users with particular name or email
export const allUsers = asyncHandler(
    async (req, res) => {
        const keyword = req.query.search ?
            {
                // search in db with regex for name or email
                $or: [
                    { name: { $regex: req.query.search, $options: "i" } },
                    { email: { $regex: req.query.search, $options: "i" } },
                ],
            } : {};

            //send all the users except the logged in user 
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
        token: generateToken(updatedUser._id),
    });
});
