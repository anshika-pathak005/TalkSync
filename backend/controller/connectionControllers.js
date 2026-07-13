import asyncHandler from "express-async-handler";
import Connection from "../Modals/connectionModel.js";
import { getConnectionBetween } from "../utils/connectionUtils.js";

// send a connection request to another user
export const sendConnectionRequest = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        res.status(400);
        throw new Error("userId is required");
    }

    if (userId === req.user._id.toString()) {
        res.status(400);
        throw new Error("You cannot send a connection request to yourself");
    }

    const existing = await getConnectionBetween(req.user._id, userId);

    if (existing) {
        if (existing.status === "pending") {
            res.status(400);
            throw new Error("A connection request is already pending between you two");
        }

        if (existing.status === "accepted") {
            res.status(400);
            throw new Error("You are already connected with this user");
        }

        // rejected or removed before — reuse the row instead of violating the unique index
        if (existing.status === "rejected" || existing.status === "removed") {
            existing.sender = req.user._id;
            existing.receiver = userId;
            existing.status = "pending";
            existing.removedBy = undefined;
            await existing.save();

            const populated = await existing.populate("sender receiver", "-password");
            return res.status(200).json(populated);
        }
    }

    const connection = await Connection.create({
        sender: req.user._id,
        receiver: userId,
        status: "pending",
    });

    const fullConnection = await Connection.findById(connection._id).populate(
        "sender receiver",
        "-password"
    );

    res.status(201).json(fullConnection);
});

// receiver accepts a pending request
export const acceptConnectionRequest = asyncHandler(async (req, res) => {
    const { connectionId } = req.body;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
        res.status(404);
        throw new Error("Connection request not found");
    }

    if (connection.receiver.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("You are not authorized to accept this request");
    }

    if (connection.status !== "pending") {
        res.status(400);
        throw new Error("This request is no longer pending");
    }

    connection.status = "accepted";
    connection.removedBy = undefined;
    await connection.save();

    const fullConnection = await Connection.findById(connection._id).populate(
        "sender receiver",
        "-password"
    );

    res.status(200).json(fullConnection);
});

// receiver rejects a pending request
export const rejectConnectionRequest = asyncHandler(async (req, res) => {
    const { connectionId } = req.body;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
        res.status(404);
        throw new Error("Connection request not found");
    }

    if (connection.receiver.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("You are not authorized to reject this request");
    }

    if (connection.status !== "pending") {
        res.status(400);
        throw new Error("This request is no longer pending");
    }

    connection.status = "rejected";
    await connection.save();

    res.status(200).json({ message: "Connection request rejected" });
});

// sender withdraws their own pending request
export const cancelConnectionRequest = asyncHandler(async (req, res) => {
    const { connectionId } = req.body;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
        res.status(404);
        throw new Error("Connection request not found");
    }

    if (connection.sender.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Only the sender can cancel this request");
    }

    if (connection.status !== "pending") {
        res.status(400);
        throw new Error("Only pending requests can be cancelled");
    }

    await connection.deleteOne();

    res.status(200).json({ message: "Connection request cancelled" });
});

// unfriend an accepted connection
export const removeConnection = asyncHandler(async (req, res) => {
    const { connectionId } = req.body;

    const connection = await Connection.findById(connectionId);

    if (!connection) {
        res.status(404);
        throw new Error("Connection not found");
    }

    const isParticipant =
        connection.sender.toString() === req.user._id.toString() ||
        connection.receiver.toString() === req.user._id.toString();

    if (!isParticipant) {
        res.status(403);
        throw new Error("You are not part of this connection");
    }

    if (connection.status !== "accepted") {
        res.status(400);
        throw new Error("You can only remove an active connection");
    }

    connection.status = "removed";
    connection.removedBy = req.user._id;
    await connection.save();

    res.status(200).json({ message: "Connection removed" });
});

// all accepted connections for the logged in user (for Connections Page)
export const getMyConnections = asyncHandler(async (req, res) => {
    const connections = await Connection.find({
        status: "accepted",
        $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    }).populate("sender receiver", "-password");

    const formatted = connections.map((conn) => {
        const otherUser =
            conn.sender._id.toString() === req.user._id.toString()
                ? conn.receiver
                : conn.sender;

        return {
            connectionId: conn._id,
            user: otherUser,
            connectedSince: conn.updatedAt,
        };
    });

    res.status(200).json(formatted);
});

// incoming pending requests (for Profile / notifications)
export const getPendingRequests = asyncHandler(async (req, res) => {
    const requests = await Connection.find({
        receiver: req.user._id,
        status: "pending",
    }).populate("sender", "-password");

    res.status(200).json(requests);
});

// outgoing pending requests (so search UI can show "Requested")
export const getSentRequests = asyncHandler(async (req, res) => {
    const requests = await Connection.find({
        sender: req.user._id,
        status: "pending",
    }).populate("receiver", "-password");

    res.status(200).json(requests);
});

// status between me and a specific user (for search result buttons)
export const getConnectionStatusWith = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const connection = await getConnectionBetween(req.user._id, userId);

    if (!connection) {
        return res.status(200).json({ status: "none" });
    }

    res.status(200).json({
        status: connection.status,
        connectionId: connection._id,
        isSender: connection.sender.toString() === req.user._id.toString(),
        removedBy: connection.removedBy,
    });
});