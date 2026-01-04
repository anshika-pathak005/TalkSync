// here in this file all the routes related to user would be defined

import express from "express";
import { registerUser, authUser, allUsers, updatePassword, updateProfilePic } from "../controller/userControllers.js";
import { protect } from "../middlewares/authMiddleware.js";

export const router = express.Router();

// now like this i can define the APIs here, if i start with writing the route then i can chain multiple methods on that route
// this api is for registering the user
router.route("/").post(registerUser);

// but if i write like this then i can only define one method on that route weather post or get or anything
router.post("/login",authUser);

// api for search the user
router.route("/").get(protect,allUsers);

// api for updation of the password
router.route("/update-password").put(protect,updatePassword);

// api for picture updation
router.route("/update-pic").put(protect, updateProfilePic);

// module.exports = { userRoutes };

export default router;