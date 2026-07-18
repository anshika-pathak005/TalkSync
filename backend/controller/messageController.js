import asyncHandler from 'express-async-handler'
import Message from "../Modals/messageModel.js";
import Chat from '../Modals/chatModel.js';
import User from '../Modals/userModel.js';
import { getConnectionBetween } from "../utils/connectionUtils.js";

export const sendMessage = asyncHandler(
    async (req, res) => {

        // we need 3 things , chat id jispe message bhej rhe hia
        // the content of the message
        //the sender who is sending the message
        //chat id and content will be in the req body, and user middelware se

        const { content, chatId } = req.body;

        // if these 2 are not there
        if (!content || !chatId) {
            // console.log("invalid data")
            return res.sendStatus(400);
        }

        // fetch the chat to find the other participant (only relevant for 1:1 chats)
        const chat = await Chat.findById(chatId);

        if (!chat) {
            res.status(404);
            throw new Error("Chat not found");
        }

        if (!chat.isGroupChat) {
            const otherUserId = chat.users.find(
                (u) => u.toString() !== req.user._id.toString()
            );

            const connection = await getConnectionBetween(req.user._id, otherUserId);

            if (!connection || connection.status !== "accepted") {
                res.status(403);
                throw new Error("You are no longer connected with this user. Reconnect to send messages.");
            }
        }

        // if everything is there, then we will create the newmessag and save it to db
        var newMessage = {
            sender: req.user._id,
            content: content,
            chat: chatId,
        };

        // query db

        try {

            var message = await Message.create(newMessage);

            message = await message.populate("sender", "name pic");
            message = await message.populate("chat");
            message = await User.populate(message, {
                path: "chat.users",
                select: "name pic email",
            });

            // now replacing this message with the latest message, 
            // await Chat.findByIdAndUpdate(req.body.chatId,{
            //     latestMessage : message,
            // })

            // clearing the deleteby array so that if new message comes then it should be visible to the user, who has deleted
            await Chat.findByIdAndUpdate(
                chatId,
                {
                    latestMessage: message,
                    // deletedBy: []
                }
            );

            // then send this message as response
            res.json(message);

        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }

    }
)

export const fetchAllMessages = asyncHandler(async (req, res) => {

    // first fetch the chat to check delete history
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
        res.status(404);
        throw new Error("Chat not found");
    }

    // check if the logged-in user has deleted this chat
    const deletedEntry = chat.deletedBy.find(
        (entry) => entry.user.toString() === req.user._id.toString()
    );

    let messages;

    // if user has deleted the chat before
    if (deletedEntry) {
        // fetch only messages created AFTER deletion time
        messages = await Message.find({
            chat: req.params.chatId,
            createdAt: { $gt: deletedEntry.deletedAt },
            deletedFor: { $ne: req.user._id },
        })
            .populate("sender", "name email pic")
            .populate("chat");
    }
    else {
        // if user never deleted the chat, fetch all messages
        messages = await Message.find({
            chat: req.params.chatId,
            deletedFor: { $ne: req.user._id },
        })
            .populate("sender", "name email pic")
            .populate("chat");
    }

    // send messages as response
    res.json(messages);
});


// delete for me — only affects the requesting user's own view.
// works on ANY message in a chat you're part of, sent by you or
// received, exactly like WhatsApp
export const deleteMessageForMe = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId).populate("chat");
    if (!message) {
        res.status(404);
        throw new Error("Message not found");
    }

    // confirm the requester is actually part of this chat
    const isParticipant = message.chat.users.some(
        (u) => u.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
        res.status(403);
        throw new Error("You are not part of this chat");
    }

    // avoid duplicate entries if somehow called twice
    const alreadyDeleted = message.deletedFor.some(
        (id) => id.toString() === req.user._id.toString()
    );

    if (!alreadyDeleted) {
        message.deletedFor.push(req.user._id);
        await message.save();
    }

    res.json({ message: "Message deleted for you" });
});

// delete for everyone — only the ORIGINAL SENDER can do this.
// permanently overwrites content in the DB, broadcasts live via
// socket (frontend handles the emit, same pattern as system messages)
export const deleteMessageForEveryone = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId)
        .populate("chat")
        .populate("sender", "name pic");

    if (!message) {
        res.status(404);
        throw new Error("Message not found");
    }

    if (message.sender._id.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("You can only delete your own messages for everyone");
    }

    // overwrite content permanently
    message.content = "This message was deleted";
    message.isDeletedForEveryone = true;
    await message.save();

    // update latestMessage preview if this was it
    const chat = await Chat.findById(message.chat._id);
    if (chat.latestMessage?.toString() === message._id.toString()) {
        await Chat.findByIdAndUpdate(message.chat._id, {
            latestMessage: message._id,
        });
    }

    // ── REPLACE THE OLD res.json(...) LINE WITH THIS BLOCK ──
    // populate chat.users fully before sending — required so the
    // socket broadcast on the frontend (server.js's "message deleted"
    // handler) can loop over chat.users to know who to notify.
    // Without this, chat.users would be undefined on the emitted
    // payload and the broadcast would silently drop, same bug we
    // hit earlier with system messages.
    let populatedMessage = await message.populate("chat");
    populatedMessage = await User.populate(populatedMessage, {
        path: "chat.users",
        select: "name pic email",
    });

    res.json({ updatedMessage: populatedMessage });
});