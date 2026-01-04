import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {sendMessage,fetchAllMessages} from '../controller/messageController.js'

const router = express.Router();

// to send the message
router.route('/').post(protect,sendMessage);

// to fetch the message for 1 single chat
router.route('/:chatId').get(protect,fetchAllMessages);

export default router;