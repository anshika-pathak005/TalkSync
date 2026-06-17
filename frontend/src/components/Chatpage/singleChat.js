import React, { useEffect, useState } from "react";
import { ChatState } from "../../context/ChatProvider";
import { ArrowLeft, Send, Loader2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getSender, getSenderFullData } from "../../config/ChatsLogic";
import ProfileModal from "../others/profileModal";
import UpdateGroupChatModal from "../others/updateGroupChatModal";
import axios from "axios";
import "./styles.css";
import ChatMessages from "./ChatMessages";
import io from "socket.io-client";

const ENDPOINT =
    process.env.NODE_ENV === "production"
        ? window.location.origin
        : "http://localhost:5000";

var socket, selectedChatCompare;

const SingleChat = ({ fetchChatAgain, setFetchChatAgain }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const {
        user,
        selectedChat,
        setSelectedChat,
        setNotification,
        setChats,
    } = ChatState();

    const fetchAllMessages = async () => {
        if (!selectedChat) return;

        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const { data } = await axios.get(
                `/api/message/${selectedChat._id}`,
                config
            );
            setMessages(data);
            setLoading(false);
            socket.emit("join chat", selectedChat._id);
        } catch (error) {
            // toast removed
        }
    };

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
        socket.on("connected", () => setSocketConnected(true));
        socket.on("typing", () => setIsTyping(true));
        socket.on("stop typing", () => setIsTyping(false));
    }, []);

    useEffect(() => {
        fetchAllMessages();
        selectedChatCompare = selectedChat;
        // eslint-disable-next-line
    }, [selectedChat]);

    useEffect(() => {
        if (!selectedChat) return;
        setNotification((prev) =>
            prev.filter((n) => n.chat._id !== selectedChat._id)
        );
        // eslint-disable-next-line
    }, [selectedChat]);

    useEffect(() => {
        const handleMessage = (newMessageRecieved) => {
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
            } else {
                setMessages((prev) => [...prev, newMessageRecieved]);
            }
        };

        socket.on("message recieved", handleMessage);
        return () => socket.off("message recieved", handleMessage);
    }, [selectedChatCompare]);

    const sendMessage = async () => {
        if (!newMessage) return;

        socket.emit("stop typing", selectedChat._id);
        try {
            const messageToSend = newMessage;
            setNewMessage("");

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.post(
                "/api/message",
                { content: messageToSend, chatId: selectedChat._id },
                config
            );

            socket.emit("new message", data);
            setMessages((prev) => [...prev, data]);

            setChats((prev) =>
                prev.map((chat) =>
                    chat._id === selectedChat._id
                        ? { ...chat, latestMessage: data }
                        : chat
                )
            );
        } catch (error) {
            // toast removed
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") sendMessage();
    };

    const typingHandler = (e) => {
        setNewMessage(e.target.value);

        if (!socketConnected) return;

        if (!typing) {
            setTyping(true);
            socket.emit("typing", selectedChat._id);
        }

        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;

        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;

            if (timeDiff >= timerLength && typing) {
                socket.emit("stop typing", selectedChat._id);
                setTyping(false);
            }
        }, timerLength);
    };

    return (
        <div className="w-full h-full flex flex-col">
            {selectedChat ? (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between w-full px-4 py-3 border-b border-nordic/40">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedChat("")}
                                className="md:hidden p-2 rounded-lg hover:bg-swan text-viridian transition-colors"
                            >
                                <ArrowLeft size={18} />
                            </button>

                            <h3 className="font-display text-viridian text-lg sm:text-xl">
                                {!selectedChat.isGroupChat
                                    ? getSender(user, selectedChat.users)
                                    : selectedChat.chatName.toUpperCase()}
                            </h3>
                        </div>

                        {!selectedChat.isGroupChat ? (
                            <ProfileModal user={getSenderFullData(user, selectedChat.users)} />
                        ) : (
                            <UpdateGroupChatModal
                                fetchChatAgain={fetchChatAgain}
                                setFetchChatAgain={setFetchChatAgain}
                                fetchAllMessages={fetchAllMessages}
                            />
                        )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 flex flex-col bg-swan/60 overflow-hidden">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 size={36} className="animate-spin text-cerulean" />
                            </div>
                        ) : (
                            <div className="messages flex-1">
                                <ChatMessages messages={messages} />
                            </div>
                        )}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div className="px-4 pb-1">
                                <span className="text-xs text-saltwater italic">typing...</span>
                            </div>
                        )}

                        {/* Input */}
                        <div className="flex items-center gap-2 p-3 bg-white border-t border-nordic/40">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={typingHandler}
                                onKeyDown={handleKeyDown}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-swan border border-nordic
                  text-sm placeholder:text-gray-400 focus:outline-none
                  focus:ring-2 focus:ring-cerulean transition-all duration-200"
                            />
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={sendMessage}
                                className="p-2.5 rounded-xl bg-gradient-to-r from-peacock to-cerulean
                  text-white shadow-3d hover:shadow-3d-hover transition-all"
                            >
                                <Send size={18} />
                            </motion.button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-saltwater gap-3">
                    <MessageCircle size={48} className="text-nordic" />
                    <p className="font-display text-xl text-viridian">
                        Select a user to start chatting
                    </p>
                </div>
            )}
        </div>
    );
};

export default SingleChat;