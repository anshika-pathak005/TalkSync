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
    },
    {
        timestamps : true,
    },
)

const Message = mongoose.model("Message",messageModel);

// module.exports = Message;
export default Message;