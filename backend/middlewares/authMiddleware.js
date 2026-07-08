import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../Modals/userModel.js";

// middleware for user authentication

export const protect = asyncHandler(
    async (req, res, next) => {
        let token;

        // check if authorization header is present in the request and starts with Bearer
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            try {
                // get the token from header and remove Bearer part
                token = req.headers.authorization.split(" ")[1];

                // Verify the received JWT using the application's secret key.
                // If the token is valid, jwt.verify() authenticates it and returns the decoded payload
                // (which contains the data stored while generating the token, such as the user ID).
                // If the token has been tampered with, is signed with a different secret key,
                // or has expired, jwt.verify() throws an error, which is handled by the catch block below.
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // get the user from the token and attach to req object
                req.user = await User.findById(decoded.id).select("-password");
                next();
            } catch (error) {
                res.status(401);
                throw new Error("Not authorized, token failed");
            }
        }
        else {
            res.status(401);
            throw new Error("Not authorized, no token");
        }
    }
)