import asyncHandler from 'express-async-handler'
import Message from "../Modals/messageModel.js";
import Chat from '../Modals/chatModel.js';
import User from '../Modals/userModel.js';


export const sendMessage = asyncHandler(
    async(req,res)=>{

        // we need 3 things , chat id jispe message bhej rhe hia
        // the content of the message
        //the sender who is sending the message
        //chat id and content will be in the req body, and user middelware se

        const { content, chatId } = req.body;

        // if these 2 are not there
        if (!content || !chatId){
            // console.log("invalid data")
            return res.sendStatus(400);
        }

        // if everything is there, then we will create the newmessag and save it to db
        var newMessage = {
            sender : req.user._id,
            content : content,
            chat : chatId,
        };

        // query db

        try{

            var message = await Message.create(newMessage);

            message = await message.populate("sender","name pic");
            message = await message.populate("chat");
            message = await User.populate(message,{
                path:"chat.users",
                select:"name pic email",
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
                    deletedBy: []
                }
            );

            // then send this message as response
            res.json(message);

        }catch(error){
            res.status(400);
            throw new Error(error.message);
        }

    }
)

// export const fetchAllMessages = asyncHandler(

//     async(req,res) => {
//         // here just fethc all the messags for that particular chat and send it to the user-
//         // get the chatid from param and regarding that send all the messages
        
//         try {
//             const messages = await Message.find({chat : req.params.chatId})
//             .populate("sender","name email pic")
//             .populate("chat");

//             // then send this message as response
//             res.json(messages);
            
//         } catch (error) {
//             res.status(400);
//             throw new Error(error.message);
//         }
//     }
// )


// export const fetchAllMessages = asyncHandler(async (req, res) => {
//     try {
//         // STEP 1:
//         // First, find the chat document using the chatId from params
//         const chat = await Chat.findById(req.params.chatId);

//         // If the chat does not exist, return an error
//         if (!chat) {
//             res.status(404);
//             throw new Error("Chat not found");
//         }

//         // STEP 2:
//         // Check if the current user has deleted this chat before
//         // deletedBy stores objects like: { user, deletedAt }
//         const deletedInfo = chat.deletedBy?.find(
//             (d) => d.user.toString() === req.user._id.toString()
//         );

//         // STEP 3:
//         // Base query to fetch messages for this chat
//         let query = {
//             chat: req.params.chatId,
//         };

//         // STEP 4:
//         // If the user deleted the chat,
//         // only fetch messages sent AFTER the delete time
//         if (deletedInfo) {
//             query.createdAt = {
//                 $gt: deletedInfo.deletedAt,
//             };
//         }

//         // STEP 5:
//         // Fetch messages based on the final query
//         const messages = await Message.find(query)
//             .populate("sender", "name email pic") // populate sender details
//             .populate("chat"); // populate chat details

//         // STEP 6:
//         // Send the filtered messages back to the client
//         res.json(messages);

//     } catch (error) {
//         res.status(400);
//         throw new Error(error.message);
//     }
// });

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
            createdAt: { $gt: deletedEntry.deletedAt }
        })
            .populate("sender", "name email pic")
            .populate("chat");
    }
    else {
        // if user never deleted the chat, fetch all messages
        messages = await Message.find({
            chat: req.params.chatId
        })
            .populate("sender", "name email pic")
            .populate("chat");
    }

    // send messages as response
    res.json(messages);
});
