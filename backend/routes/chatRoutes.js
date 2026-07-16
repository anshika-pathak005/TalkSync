import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup, deleteChatForMe, leaveGroup } from "../controller/chatController.js";
// , fetchChat, createGroupChat, renameGroup, addToGroup, removeFromGroup

const router = express.Router();

// first is for accessing the chat or creating the chat
// protect means only authorized user can use this route
router.route("/").post(protect,accessChat);
// .for getting all the chats for a user
router.route('/').get(protect, fetchChats);
// 3- api for creation of the group
router.route('/group').post(protect,createGroupChat);
// // 4- api for renaming the group
router.route('/groupRename').put(protect,renameGroup);
// // 5- api for adding the user to group chat
router.route('/groupAdd').put(protect,addToGroup);
// //6- api for removing the user from the group chat
router.route('/groupRemove').put(protect,removeFromGroup);
router.route("/leave").put(protect, leaveGroup);

// route for deleting
router.route('/delete/:chatId').delete(protect, deleteChatForMe);


export default router;