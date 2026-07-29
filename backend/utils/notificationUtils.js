import Notification from "../Modals/notificationModel.js";

// one row per chat for message notifications — bumps count if an
// UNREAD row already exists for this recipient+chat, otherwise
// creates a fresh one. Once the user reads it (isRead becomes true),
// the NEXT new message starts a brand new row at count: 1 — this is
// why the query below filters on isRead: false specifically.
export const upsertMessageNotification = async ({ recipientId, senderId, chatId, contentPreview }) => {
    const existing = await Notification.findOne({
        recipient: recipientId,
        chat: chatId,
        type: "new_message",
        isRead: false,
    });

    if (existing) {
        existing.content = contentPreview;
        existing.count += 1;
        existing.sender = senderId;
        // NOTE: createdAt is intentionally untouched here — the TTL
        // clock keeps counting from the original creation time
        await existing.save();
        return existing;
    }

    return await Notification.create({
        recipient: recipientId,
        sender: senderId,
        chat: chatId,
        type: "new_message",
        content: contentPreview,
        count: 1,
    });
};

// for one-off notification types that don't need count aggregation —
// connection_request, connection_accepted, added_to_group
export const createSimpleNotification = async ({
    recipientId,
    senderId,
    type,
    connectionId,
    chatId,
    content,
}) => {
    return await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        connection: connectionId,
        chat: chatId,
        content,
    });
};

// one row per (recipient, connection) — reused for the LIFETIME of that
// connection doc, regardless of isRead. A connection is reused across
// reject -> resend (same connectionId, see sendConnectionRequest), so
// filtering on isRead:false here would miss the already-read row and
// spawn a second one for what is really the same request. Reusing the
// row and flipping isRead back to false resurfaces it instead.
export const upsertConnectionRequestNotification = async ({
    recipientId,
    senderId,
    connectionId,
    content,
}) => {
    const existing = await Notification.findOne({
        recipient: recipientId,
        type: "connection_request",
        connection: connectionId,
    });

    if (existing) {
        existing.content = content;
        existing.sender = senderId;
        existing.isRead = false;
        await existing.save();
        return existing;
    }

    return await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: "connection_request",
        connection: connectionId,
        content,
    });
};