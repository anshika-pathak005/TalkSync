import mongoose from "mongoose";

const messageModel = mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content : {type : String, trim: true},
        chat: {type: mongoose.Schema.Types.ObjectId, ref:"Chat"},
        // "text" = normal chat bubble, "system" = centered info badge
        // like "Shivangi left the group" or "Shivangi was removed by Admin"
        messageType: {
            type: String,
            enum: ["text", "system"],
            default: "text",
        },
        // NEW — "delete for me": list of user IDs who should no
        // longer see this message. Doesn't touch content at all,
        // purely a per-user visibility filter at fetch time.
        deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

        // NEW — "delete for everyone": once true, content is
        // permanently overwritten server-side, visible to all
        // participants as a placeholder, forever.
        isDeletedForEveryone: { type: Boolean, default: false },
    },
    {
        timestamps : true,
    },
)

const Message = mongoose.model("Message",messageModel);

// module.exports = Message;
export default Message;