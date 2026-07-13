import mongoose from "mongoose";

const connectionSchema = mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "removed"],
            default: "pending",
        },
        // who unfriended whom — only meaningful when status === "removed"
        removedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

// one row per pair in a given direction — app logic checks both directions
// before creating, since (A,B) and (B,A) are different index entries
connectionSchema.index({ sender: 1, receiver: 1 }, { unique: true });

const Connection = mongoose.model("Connection", connectionSchema);

export default Connection;