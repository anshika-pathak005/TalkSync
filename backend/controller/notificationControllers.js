import asyncHandler from "express-async-handler";
import Notification from "../Modals/notificationModel.js";
import Connection from "../Modals/connectionModel.js";

// fetch my notifications, newest-first, capped at 30 — bell dropdown
// doesn't need unlimited history, just the recent/relevant ones
export const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id, isRead: false })
        .populate("sender", "name pic")
        .populate("chat", "_id chatName isGroupChat")   // was: .populate("chat")
        .sort({ createdAt: -1 })
        .limit(30);

    res.json(notifications);
});

// mark one specific notification as read (e.g. clicked in the bell)
export const markNotificationRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    // already gone (e.g. wiped by a cancellation that happened while
    // this was still sitting in the user's bell from before)
    if (!notification) {
        return res.json({
            stale: true,
            message: "This notification is no longer available.",
        });
    }

    // if (!notification) {
    //     res.status(404);
    //     throw new Error("Notification not found");
    // }

    if (notification.recipient.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Not authorized");
    }

    // for connection requests specifically — confirm the underlying
    // request is still pending before treating this as actionable
    if (notification.type === "connection_request" && notification.connection) {
        const connection = await Connection.findById(notification.connection);

        if (!connection || connection.status !== "pending") {
            await notification.deleteOne();
            return res.json({
                stale: true,
                message: "This connection request is no longer available.",
            });
        }
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Marked as read" });
});

// mark everything as read — "mark all read" button in the bell
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    );
    res.json({ message: "All marked as read" });
});

// called when a user actually opens a chat — auto-clears any
// pending "new_message" notification for that chat, since they've
// now seen it the normal way, not through the bell
export const markChatNotificationsRead = asyncHandler(async (req, res) => {
    const { chatId } = req.params;

    await Notification.updateMany(
        {
            recipient: req.user._id,
            chat: chatId,
            type: "new_message",
            isRead: false,
        },
        { isRead: true }
    );

    res.json({ message: "Chat notifications marked as read" });
});