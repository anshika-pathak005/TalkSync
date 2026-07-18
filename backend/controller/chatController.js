import asyncHandler from "express-async-handler";
import Chat from "../Modals/chatModel.js";
import User from "../Modals/userModel.js";
import Message from "../Modals/messageModel.js";
import { generateToken } from "../config/generateToken.js";
import { getConnectionBetween } from "../utils/connectionUtils.js";

// in this accessChat there is going to happend 2 thing, if the chat already exists between 2 users then we will return that chat
// otherwise we will create a new chat between the 2 users and return that
export const accessChat = asyncHandler(
    async (req, res) => {
        // this is the user id of the other user with whom the logged in user wants to chat and it will be sent in the body of the request
        const { userId } = req.body;

        // if no user id sent in the request
        if (!userId) {
            console.log("UserId param not sent with request");
            return res.sendStatus(400);
        }

        // gate: only accepted connections can create/open a 1:1 chat
        const connection = await getConnectionBetween(req.user._id, userId);

        if (!connection || connection.status !== "accepted") {
            res.status(403);
            throw new Error("You must be connected with this user to start a chat");
        }

        // check if chat already exists between the 2 users
        var isChat = await Chat.find({
            // it should not be a group chat
            isGroupChat: false,

            // it should contain both the 2 user only
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],
        }).populate("users", "-password") //if chat found populate the users except password
            .populate("latestMessage");

        // populate the sender of the latest message
        isChat = await User.populate(isChat, {
            path: "latestMessage.sender",
            select: "name pic email",
        });

        // now isChat has the all of the data so send it to user if it has something
        if (isChat.length > 0) {
            res.send(isChat[0]); //because there will be only one chat between these 2 users
        }
        else {
            // means chat doesnot exists so now we will create a new chat

            var chatData = {
                chatName: "sender", //this is a default name, later on in frontend we will show the name of the other user
                isGroupChat: false,
                users: [req.user._id, userId],
            };

            // after creation store to db
            try {
                const createdChat = await Chat.create(chatData);

                // now fetch the full chat details from db
                const FullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password");

                res.status(200).send(FullChat);

            } catch (error) {
                res.status(400);
                throw new Error(error.message);
            }
        }
    }
)

// this function fetches all the chats for the logged in user and returns them
export const fetchChats = asyncHandler(
    async (req, res) => {
        try {
            // finding all the chats that contains the logged in user and sending it in the response
            Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
                .populate("users", "-password")
                // populating users details without password
                .populate("groupAdmin", "-password")
                // if it is a group chat the groupadmin field as well
                .populate("latestMessage")
                // populating latest message
                .sort({ updatedAt: -1 }) //to show the latest chat at the top
                .then(async (results) => {
                    // populating the sender of the latest message
                    results = await User.populate(results, {
                        path: "latestMessage.sender",
                        select: "name pic email",
                    });

                    // is any particular chat has less than 2 people then dont send it because , even if it is single chat ,still it would have 2 people, hehehe, as of now i've applied this logic , which should be good
                    results = results.filter(chat => {
                        if (!chat.users) return false;

                        // one-to-one chat
                        if (!chat.isGroupChat) {
                            return chat.users.length === 2;
                        }

                        // group chat
                        return chat.users.length >= 2;
                    });

                    // hide chats deleted by this user until a new message comes
                    results = results.filter((chat) => {

                        // find if this user deleted this chat
                        const deletedEntry = chat.deletedBy?.find(
                            (d) => d.user.toString() === req.user._id.toString()
                        );

                        // case 1: user never deleted this chat
                        if (!deletedEntry) return true;

                        // case 2: user deleted, but new message came later
                        if (
                            chat.latestMessage &&
                            chat.latestMessage.createdAt > deletedEntry.deletedAt
                        ) {
                            return true;
                        }

                        // case 3: user deleted & no new message
                        return false;
                    });

                    // hide 1:1 chats where I am the one who unfriended the other user
                    const filteredForRemoval = [];
                    for (const chat of results) {
                        // if it is a group chat, keep it
                        if (chat.isGroupChat) {
                            filteredForRemoval.push(chat);
                            continue;
                        }

                        // find the other user in this 1:1 chat
                        const otherUser = chat.users.find(
                            (u) => u._id.toString() !== req.user._id.toString()
                        );

                        // if other user not found, skip this chat
                        if (!otherUser) {
                            filteredForRemoval.push(chat);
                            continue;
                        }

                        // check the connection status between the logged in user and the other user
                        const connection = await getConnectionBetween(req.user._id, otherUser._id);

                        // if I removed this connection, then I lose visibility of the chat
                        if (
                            connection &&
                            connection.status === "removed" &&
                            connection.removedBy?.toString() === req.user._id.toString()
                        ) {
                            // I removed this connection, so I lose visibility of the chat
                            continue;
                        }

                        // keep the chat in all other cases
                        filteredForRemoval.push(chat);
                    }

                    res.status(200).send(filteredForRemoval);
                });
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
);

export const createGroupChat = asyncHandler(
    async (req, res) => {
        // this api is for creating the group chat

        // to create a group chat we need 2 things
        // 1- name of the group
        // 2- users to be added in the group (2 or more users)

        // first check if both the things are present in the request body
        if (!req.body.users || !req.body.name) {
            return res.status(400).send({ message: "Please Fill all the feilds" });
        }

        // now if we got the users and name
        // we would get the users in an array as a string so we need to parse it to json
        var users = JSON.parse(req.body.users);

        // check if there are atleast 2 users
        if (users.length < 2) {
            return res.status(400).send("More than 2 users are required to form a group chat");
        }

        // adding the logged in user also to the users array
        users.push(req.user);

        // now we have the name and users array
        // we can create the group chat now
        try {

            const groupChat = await Chat.create({
                chatName: req.body.name,
                users: users,
                isGroupChat: true,
                groupAdmin: req.user,
            });

            // now we will fetch the full details of the group chat and send it in the response
            const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users","-password")
            .populate("groupAdmin","-password");

            res.status(200).json(fullGroupChat);
        
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
        

        // const { users, name } = req.body;
    }
);

export const renameGroup = asyncHandler(
    async (req, res) => {
        // api for renaming the group chat

        // fetch the chatId and the new chatName from the request body
        const { chatId, chatName } = req.body;

        // now update the chat name
        const updatedChat = await Chat.findByIdAndUpdate(chatId,{
            chatName: chatName,
        },
        { new: true } )//to return the updated chat
        .populate("users","-password")
        .populate("groupAdmin","-password");

        // if no chat found with that id then send the error otherwise send updated chat
        if(!updatedChat){
            res.status(404);
            throw new Error("Chat Not Found");
        }else{
            res.json(updatedChat);
        }
    }
);

// export const addToGroup = asyncHandler(
//     async (req, res) => {
//         // api for adding the user to group chat

//         // ill need chatId in which the user is to be added and the userId of the user to be added
//         const { chatId, userId } = req.body;

//         // now update the chat to add the user
//         const added = await Chat.findByIdAndUpdate(chatId,{
//             $push: { users: userId },
//         },
//         { new: true } )//to return the updated chat
//         .populate("users","-password")
//         .populate("groupAdmin","-password");

//         // if no chat found with that id then send the error otherwise send updated chat
//         if(!added){
//             res.status(404);
//             throw new Error("Chat Not Found");
//         }else{
//             res.json(added);
//         }
//     }
// );

export const addToGroup = asyncHandler(
    async (req, res) => {
        const { chatId, userId } = req.body;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            res.status(404);
            throw new Error("Chat Not Found");
        }

        // only the group admin can add members — same rule your
        // frontend already enforces, now also enforced server-side
        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error("Only the group admin can add members");
        }

        // NEW — bail out early if this user is already in the group,
        // instead of pushing a duplicate + creating a redundant
        // "was added" system message on retry/double-click
        const alreadyMember = chat.users.some(
            (u) => u.toString() === userId
        );

        if (alreadyMember) {
            res.status(400);
            throw new Error("User is already a member of this group");
        }

        const addedUser = await User.findById(userId).select("name");

        const added = await Chat.findByIdAndUpdate(
            chatId,
            { $addToSet: { users: userId } },  // was $push — prevents duplicate entries
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!added) {
            res.status(404);
            throw new Error("Chat Not Found");
        }

        // create the system message announcing the addition
        const systemMessage = await Message.create({
            sender: req.user._id,
            content: `${addedUser?.name || "A user"} was added to the group`,
            chat: chatId,
            messageType: "system",
        });

        let populatedSystemMessage = await systemMessage.populate("sender", "name pic");

        // NEW — without this, chat.users is undefined on the socket
        // payload and server.js's "new message" handler silently drops
        // it instead of broadcasting to the group in real time
        populatedSystemMessage = await populatedSystemMessage.populate("chat");
        populatedSystemMessage = await User.populate(populatedSystemMessage, {
            path: "chat.users",
            select: "name pic email",
        });

        await Chat.findByIdAndUpdate(chatId, { latestMessage: populatedSystemMessage });

        res.json({ chat: added, systemMessage: populatedSystemMessage });
    }
);

export const removeFromGroup = asyncHandler(
    async (req, res) => {
        // admin removes someone else from the group
        const { chatId, userId } = req.body;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            res.status(404);
            throw new Error("Chat Not Found");
        }

        // only the group admin can remove other members
        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error("Only the group admin can remove members");
        }

        const removedUser = await User.findById(userId).select("name");

        const removed = await Chat.findByIdAndUpdate(
            chatId,
            { $pull: { users: userId } },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!removed) {
            res.status(404);
            throw new Error("Chat Not Found");
        }

        // create the system message announcing the removal
        const systemMessage = await Message.create({
            sender: req.user._id,
            content: `${removedUser?.name || "A user"} was removed from the group`,
            chat: chatId,
            messageType: "system",
        });

        let populatedSystemMessage = await systemMessage.populate("sender", "name pic");

        // NEW — same fix, chat.users must be populated for the socket
        // broadcast in server.js to find recipients
        populatedSystemMessage = await populatedSystemMessage.populate("chat");
        populatedSystemMessage = await User.populate(populatedSystemMessage, {
            path: "chat.users",
            select: "name pic email",
        });

        await Chat.findByIdAndUpdate(chatId, { latestMessage: populatedSystemMessage });

        res.json({ chat: removed, systemMessage: populatedSystemMessage });
    }
);

export const leaveGroup = asyncHandler(
    async (req, res) => {
        // a user removes themselves from the group
        const { chatId } = req.body;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            res.status(404);
            throw new Error("Chat Not Found");
        }

        const isMember = chat.users.some(
            (u) => u.toString() === req.user._id.toString()
        );

        if (!isMember) {
            res.status(400);
            throw new Error("You are not a member of this group");
        }

        const updated = await Chat.findByIdAndUpdate(
            chatId,
            { $pull: { users: req.user._id } },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        // create the system message announcing the departure
        const systemMessage = await Message.create({
            sender: req.user._id,
            content: `${req.user.name} left the group`,
            chat: chatId,
            messageType: "system",
        });

        let populatedSystemMessage = await systemMessage.populate("sender", "name pic");

        // NEW — same fix again
        populatedSystemMessage = await populatedSystemMessage.populate("chat");
        populatedSystemMessage = await User.populate(populatedSystemMessage, {
            path: "chat.users",
            select: "name pic email",
        });

        await Chat.findByIdAndUpdate(chatId, { latestMessage: populatedSystemMessage });

        res.json({ chat: updated, systemMessage: populatedSystemMessage });
    }
);


// delete the chat

export const deleteChatForMe = asyncHandler(async (req, res) => {
    const chatId = req.params.chatId;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404);
        throw new Error("Chat not found");
    }

    const existingEntry = chat.deletedBy.find(
        (d) => d.user.toString() === userId.toString()
    );

    if (existingEntry) {
        existingEntry.deletedAt = new Date();
    } else {
        chat.deletedBy.push({ user: userId, deletedAt: new Date() });
    }

    await chat.save();

    // NEW — only attempt permanent cleanup for 1:1 chats, since group
    // chats can have many members and "everyone deleted" is a much
    // rarer and messier condition to track correctly there
    if (!chat.isGroupChat) {
        await purgeMessagesDeletedByEveryone(chat);
    }

    res.json({ message: "Chat deleted for you" });
});

// checks if EVERY user in this chat has deleted it, and if so,
// permanently removes messages older than the earliest of their
// cutoffs — those messages are unreachable by anyone from now on,
// since deletedAt only ever moves forward in time, never back
const purgeMessagesDeletedByEveryone = async (chat) => {
    const allUsersDeleted = chat.users.every((u) =>
        chat.deletedBy.some((d) => d.user.toString() === u.toString())
    );

    if (!allUsersDeleted) return; // at least one user hasn't deleted — nothing is safe yet

    // the earliest cutoff among all users — messages at or before
    // this point are invisible to EVERY user in the chat
    const cutoff = chat.deletedBy.reduce((earliest, entry) => {
        return entry.deletedAt < earliest ? entry.deletedAt : earliest;
    }, chat.deletedBy[0].deletedAt);

    await Message.deleteMany({
        chat: chat._id,
        createdAt: { $lte: cutoff },
    });
};

// export const deleteChatForMe = asyncHandler(async (req, res) => {
//     const chatId = req.params.chatId;
//     const userId = req.user._id;

//     const chat = await Chat.findById(chatId);

//     if (!chat) {
//         res.status(404);
//         throw new Error("Chat not found");
//     }

//     // check if already deleted
//     const alreadyDeleted = chat.deletedBy.find(
//         (d) => d.user.toString() === userId.toString()
//     );

//     if (alreadyDeleted) {
//         return res.json({ message: "Chat already deleted for you" });
//     }

//     chat.deletedBy.push({
//         user: userId,
//         deletedAt: new Date(),
//     });

//     await chat.save();

//     res.json({ message: "Chat deleted for you" });
// });