import mongoose from "mongoose";

const notificationSchema = mongoose.Schema(
    {
        // who this notification is FOR
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        // who/what caused it
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

        type: {
            type: String,
            enum: ["new_message", "connection_request", "connection_accepted", "added_to_group"],
            required: true,
        },

        // generic references — only the relevant one gets set per type
        chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
        connection: { type: mongoose.Schema.Types.ObjectId, ref: "Connection" },

        content: { type: String }, // short preview text

        // only meaningful for "new_message" — how many unread messages
        // this row represents (one row per chat, not one per message)
        count: { type: Number, default: 1 },

        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// auto-delete 10 days after CREATION — deliberately does NOT reset
// when the doc is updated (e.g. count bumped), per decision: if
// something's sat unread for 10 days, it clears no matter what
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 10 * 24 * 60 * 60 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;