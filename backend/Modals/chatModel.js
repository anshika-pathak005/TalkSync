// here i will define what a single chat is going to contain in it
import mongoose from "mongoose";

// creating the schema for the chat- chat model
const chatModel = mongoose.Schema(
    {
        // here i  will describe what a single chat will contain
        chatName: { type: String, trim: true },
        isGroupChat:{type: Boolean, default: false},
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
        }],
        latestMessage:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        groupAdmin:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        deletedBy: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                deletedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        // NEW — tracks users who manually reopened a chat after deleting it
        // (e.g. via Connections page). Message history stays hidden per
        // deletedAt (permanent), but the chat itself becomes visible in
        // their list again, immediately, without needing a new message first.
        reopenedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    },
    {timestamps: true,}
)

// exportation
const Chat = mongoose.model("Chat", chatModel);

// module.exports = Chat;
export default Chat;
