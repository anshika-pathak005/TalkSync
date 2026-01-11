import React, { use, useEffect } from 'react'
import { ChatState } from '../../context/ChatProvider'
import { Box, Text, IconButton, FormControl, useToast, useSteps, withDefaultProps } from '@chakra-ui/react'
import { ArrowBackIcon } from '@chakra-ui/icons'
import { getSender, getSenderFullData } from '../../config/ChatsLogic'
import ProfileModal from '../others/profileModal'
import UpdateGroupChatModal from '../others/updateGroupChatModal'
import { useState } from 'react';
import { Spinner, Input } from '@chakra-ui/react'
import axios from 'axios'
import './styles.css'
import ChatMessages from './ChatMessages'
import io from 'socket.io-client'
import { time } from 'framer-motion'
import Lottie from 'react-lottie'
import animationData from '../../animations/typing.json'

// it is the backend endpoint as of now , but it will be changed when the backend is deployed
// const ENDPOINT = "http://localhost:5000";
const ENDPOINT = process.env.NODE_ENV === 'production'
    ? window.location.origin
    : "http://localhost:5000";
    
var socket, selectedChatCompare;

const SingleChat = ({ fetchChatAgain, setFetchChatAgain }) => {

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const toast = useToast();
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing,setTyping] = useState(false);
    const [isTyping,setIsTyping] = useState(false);


    // for typing indicator
    const defaultOptions = {
        loop : true,
        autoplay : true,
        animationData : animationData,
        rendererSettings : {
            preserveAspectRatio : "xMidYMid slice",
        },
    };
    


    // states from context API

    const { user, selectedChat, setSelectedChat, notification, setNotification, setChats } = ChatState();

    const fetchAllMessages = async () => {
        // if no chat is selected then dont call

        if (!selectedChat) {
            return;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                }
            }

            const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);

            setMessages(data);
            // console.log(data);
            setLoading(false);

            socket.emit("join chat", selectedChat._id);

        } catch (error) {
            toast({
                title: "Error Occured!",
                description: `Failed to fetch the messages`,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
        }
    }

    // socket 
    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
        socket.on("connected", () => setSocketConnected(true));
        socket.on('typing',()=>setIsTyping(true));
        socket.on('stop typing',()=>setIsTyping(false));

    }, []);

    // call it chat selection
    useEffect(() => {
        fetchAllMessages();

        // were comparing the selected chat state to selectedChatCompare state to decide if we have to emit the message or we have to give the notiification to the user - backup
        selectedChatCompare = selectedChat;
    }, [selectedChat]);

    // jaise hi user koi chat open kare
    // us chat ki notification automatically remove karni hai
    useEffect(() => {
        if (!selectedChat) return;

        setNotification((prev) =>
            prev.filter(
                (n) => n.chat._id !== selectedChat._id
            )
        );

    }, [selectedChat]);


    // now make a useeffeect that will run all the time as the state changes
    // useEffect(() => {
    //     socket.on("message recieved", (newMessageRecieved) => {

    //         // if no chat is selected then if message comes form any of the chat keep it in notifications
    //         // or if message is recived in another chat that we are not currently in then also send or mark this message as notification
    //         if (!selectedChatCompare
    //             || selectedChatCompare._id !== newMessageRecieved.chat._id
    //         ) {
    //             //send notification
    //             if(!notification.includes(newMessageRecieved)){
    //                 setNotification([newMessageRecieved,...notification]);
    //                 // fetch all of the chats again
    //                 setFetchChatAgain(!fetchChatAgain);
    //             }

    //         }
    //         // otherwise this message should me appended to the messages array
    //         else {
    //             setMessages([...messages, newMessageRecieved]);
    //         }
    //     })
    // })

    useEffect(() => {

        const handleMessage = (newMessageRecieved) => {

            // agar chat open nahi hai ya doosri chat ka message hai
            if (
                !selectedChatCompare ||
                selectedChatCompare._id !== newMessageRecieved.chat._id
            ) {

                setNotification((prev) => {
                    const existing = prev.find(
                        (n) => n.chat._id === newMessageRecieved.chat._id
                    );

                    if (existing) {
                        return prev.map((n) =>
                            n.chat._id === newMessageRecieved.chat._id
                                ? {
                                    ...n,
                                    lastMessage: newMessageRecieved.content,
                                    count: n.count + 1,
                                }
                                : n
                        );
                    }

                    return [
                        {
                            chat: newMessageRecieved.chat,
                            sender: newMessageRecieved.sender,
                            lastMessage: newMessageRecieved.content,
                            count: 1,
                        },
                        ...prev,
                    ];
                });

                setFetchChatAgain((prev) => !prev);
            }
            else {
                setMessages((prev) => [...prev, newMessageRecieved]);
            }
        };

        // socket listener lagaya
        socket.on("message recieved", handleMessage);

        // cleanup – purana listener hata diya
        return () => {
            socket.off("message recieved", handleMessage);
        };

    }, [selectedChatCompare]);

    const sendMessage = async (event) => {
        // this will run when key is presed
        // and if that key is the enter key and we have somemessage only then trigger
        if (event.key === "Enter" && newMessage) {
            // as soon as message is sent -> stop typing
            socket.emit('stop typing',selectedChat._id);
            try {
                // api call to send message
                setNewMessage("");
                const config = {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user.token}`,
                    }
                }

                const { data } = await axios.post('/api/message', {
                    content: newMessage,
                    chatId: selectedChat._id,
                }, config);

                // clear
                // setNewMessage("");
                console.log(data);

                socket.emit("new message", data);

                // we will append this data message to the array of messages that we have already present
                setMessages([...messages, data]);

                // yahan hum chats ke state me sirf selected chat ka latestMessage update kar rahe hain
                // taaki message send hone ke baad chat list (MyChats) me bina refresh kiye
                // turant naya last message dikhne lage,
                setChats((prev) =>
                    prev.map((chat) =>
                        chat._id === selectedChat._id
                            ? { ...chat, latestMessage: data }
                            : chat
                    )
                );

            } catch (error) {
                toast({
                    title: "Error Occured!",
                    description: `Failed to send the message`,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom",
                });

            }
        }

    }

    // this will run everytime user presses any of the key!
    const typingHandler = (e) => {
        // whatever user has typed get and  set it
        setNewMessage(e.target.value);

        // for typing indicator
        // check if socketis connected , otherwise return
        if(!socketConnected) return;

        // if it is not typing the set typing to true, beacuase we are pressing a key
        if(!typing) {
            setTyping(true);
            socket.emit("typing",selectedChat._id)
        }

        // if user has stopped typing so after sometime we have to stop the typing indicator
        let lastTypingTime = new Date().getTime();
        var timerLenght = 3000;

        setTimeout(()=>{
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;

            if (timeDiff >= timerLenght && typing){
                socket.emit("stop typing",selectedChat._id);
                setTyping(false);
            }
            
        },timerLenght)

    }

    {/* if any chat is selected then show that chat other show the defualt message */ }
    return <>
        {
            selectedChat ? (
                <>
                    {/* show heading that is chat or user name youre chatting with */}
                    <Box
                        fontSize={{ base: "28px", md: "30px" }}
                        pb={3}
                        px={2}
                        w="100%"
                        display="flex"
                        justifyContent={{ base: "space-between" }}
                        alignItems="center"
                    >
                        {/* to get back */}
                        <IconButton
                            d={{ base: "flex", md: "none" }}
                            icon={<ArrowBackIcon />}
                            onClick={() => setSelectedChat("")}
                        />
                        {/* Your Chat */}

                        {/* now here show the name of the user incase of single chat and if it id groupchat then show the group chat name */}

                        {!selectedChat.isGroupChat ? (
                            <>
                                {/* means it is single then show the other person name and their profile picture viewwing */}

                                {getSender(user, selectedChat.users)}
                                <ProfileModal user={getSenderFullData(user, selectedChat.users)} />
                            </>
                        ) : (
                            <>
                                {selectedChat.chatName.toUpperCase()}
                                <UpdateGroupChatModal
                                    fetchChatAgain={fetchChatAgain}
                                    setFetchChatAgain={setFetchChatAgain}
                                    fetchAllMessages={fetchAllMessages}
                                />
                            </>
                        )
                        }
                    </Box>

                    {/* next is box for message window */}
                    <Box
                        display="flex"
                        flexDir="column"
                        flex='1'
                        justifyContent="flex-end"
                        p={3}
                        bg="#E8E8E8"
                        w="100%"
                        h="100%"
                        borderRadius="lg"
                        overflowY="hidden"
                    >
                        {/* messages will be shown here */}
                        {loading ? (
                            <Spinner
                                size="xl"
                                w={20}
                                h={20}
                                alignSelf="center"
                                margin="auto" />
                        ) : (
                                <div className="messages" >
                                <ChatMessages messages={messages} />
                            </div>
                        )}

                        {/* input box for writing the message */}
                        <FormControl onKeyDown={sendMessage}>
                            {/* loading state showing when user is typing */}
                            {/* {isTyping && (
                                <div style={{ paddingLeft: 20, paddingBottom: 8 }}>
                                    <Lottie options={defaultOptions} width={40} />
                                </div>
                            )} */}

                            <Input
                                variant="filled"
                                bg="#E0E0E0"
                                placeholder="Enter a message.."
                                value={newMessage}
                                onChange={typingHandler}
                            />

                        </FormControl>
                    </Box>
                </>
            ) : (
                <Box display="flex" alignItems="center" justifyContent="center" h="100%">
                    <Text fontSize="3xl" pb={3}>
                        Select a user to start chatting
                    </Text>
                </Box>
            )
        }
    </>


}

export default SingleChat
