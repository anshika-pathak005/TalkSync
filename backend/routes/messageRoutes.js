import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { sendMessage, fetchAllMessages, deleteMessageForMe, deleteMessageForEveryone } from '../controller/messageController.js'

const router = express.Router();

// to send the message
router.route('/').post(protect,sendMessage);

// to fetch the message for 1 single chat
router.route('/:chatId').get(protect,fetchAllMessages);

router.route("/:messageId/delete-for-me").put(protect, deleteMessageForMe);

router.route("/:messageId/delete-for-everyone").put(protect, deleteMessageForEveryone);

export default router;