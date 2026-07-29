// here in this file all the routes related to user would be defined

import express from "express";
import rateLimit from "express-rate-limit";
import {
    registerUser,
    authUser,
    allUsers,
    updatePassword,
    updateProfilePic,
    refreshAccessToken,
    logoutUser,
} from "../controller/userControllers.js";
import { protect } from "../middlewares/authMiddleware.js";

export const router = express.Router();

// tighter limit on the auth-adjacent endpoints specifically — these are
// what credential-stuffing / brute-force attempts actually hit
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later." },
});

// now like this i can define the APIs here, if i start with writing the route then i can chain multiple methods on that route
// this api is for registering the user
router.route("/").post(authLimiter, registerUser);

// but if i write like this then i can only define one method on that route weather post or get or anything
router.post("/login", authLimiter, authUser);

// exchanges the httpOnly refresh cookie for a new access token
router.post("/refresh", authLimiter, refreshAccessToken);

// clears the refresh cookie + invalidates it server-side
router.post("/logout", logoutUser);

// api for search the user
router.route("/").get(protect,allUsers);

// api for updation of the password
router.route("/update-password").put(protect,updatePassword);

// api for picture updation
router.route("/update-pic").put(protect, updateProfilePic);

// module.exports = { userRoutes };

export default router;