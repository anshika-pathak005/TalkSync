import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getMyNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    markChatNotificationsRead,
} from "../controller/notificationControllers.js";

const router = express.Router();

router.route("/").get(protect, getMyNotifications);
router.route("/read-all").put(protect, markAllNotificationsRead);
router.route("/:notificationId/read").put(protect, markNotificationRead);
router.route("/chat/:chatId/read").put(protect, markChatNotificationsRead);

export default router;