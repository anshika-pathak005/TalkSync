import React, { useEffect, useState, useRef } from "react";
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

// backend URL for the socket connection — production uses same
// origin (since frontend + backend are served together), dev
// points straight at the local backend port
const ENDPOINT =
    process.env.NODE_ENV === "production"
        ? window.location.origin
        : "http://localhost:5000";

// these live OUTSIDE the component on purpose — socket needs to
// persist across re-renders without being recreated, and
// selectedChatCompare is used inside a socket event listener
// (closures there would otherwise always see the OLD selectedChat)
var socket, selectedChatCompare;

const SingleChat = ({ fetchChatAgain, setFetchChatAgain }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing, setTyping] = useState(false); // am I currently sending "typing" events?
    const [isTyping, setIsTyping] = useState(false); // is the OTHER person typing right now?
    const [systemNotice, setSystemNotice] = useState(null);

    const {
        user,
        selectedChat,
        setSelectedChat,
        setNotification,
        setChats,
    } = ChatState();

    // fetches every message for the currently selected chat from the backend
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
            // tell the socket server "I'm now watching this chat room",
            // so I receive real-time messages sent into it
            socket.emit("join chat", selectedChat._id);

            // NEW — opening this chat means any pending message
            // notification for it is now stale, clear it
            axios.put(
                `/api/notification/chat/${selectedChat._id}/read`,
                {},
                config
            ).catch(() => { });
            setNotification((prev) => prev.filter((n) => n.chat?._id !== selectedChat._id));

        } catch (error) {
            // even on failure we must stop the spinner, otherwise it
            // spins forever if the request fails
            setLoading(false);
        }
    };

    // runs ONCE when the component first mounts — sets up the socket
    // connection and its listeners for the lifetime of this component
    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
        socket.on("connected", () => setSocketConnected(true));
        socket.on("typing", () => setIsTyping(true));
        socket.on("stop typing", () => setIsTyping(false));
    }, []);

    // runs every time the user picks a different chat from the chat list
    useEffect(() => {
        // FIX: reset loading + clear old messages IMMEDIATELY, before the
        // network request even starts. Without this, the previous chat's
        // messages stay on screen for however long fetchAllMessages takes
        // to respond, which looks like the chat didn't switch at all.
        if (selectedChat) {
            setLoading(true);
            setMessages([]); // wipe old chat's messages right away
            setSystemNotice(null); // clear any stale notice from the previous chat
        }

        fetchAllMessages();

        // keep a plain-variable copy of selectedChat so the socket
        // listener below (which is set up once, separately) can always
        // check against the CURRENT chat, not a stale one from closure
        selectedChatCompare = selectedChat;
        // eslint-disable-next-line
    }, [selectedChat]);

    // whenever I open a chat, clear any unread notification badge for it
    useEffect(() => {
        if (!selectedChat) return;
        setNotification((prev) =>
            prev.filter((n) => n.chat?._id !== selectedChat._id)
        );
        // eslint-disable-next-line
    }, [selectedChat]);

    // listens for incoming real-time messages from the socket server
    useEffect(() => {
        const handleMessage = (newMessageRecieved) => {
            // if the incoming message belongs to a DIFFERENT chat than
            // the one I'm currently looking at, don't add it to the
            // visible message list — instead bump the notification bell
            if (
                !selectedChatCompare ||
                selectedChatCompare._id !== newMessageRecieved.chat._id
            ) {
                // notification creation now handled entirely server-side
                // (server.js emits a separate "notification" event) — just
                // tell MyChats to refetch so the chat moves to top with its
                // updated latestMessage
                // setNotification((prev) => {
                //     const existing = prev.find(
                //         (n) => n.chat._id === newMessageRecieved.chat._id
                //     );
                //     if (existing) {
                //         // already have a notification for this chat — just
                //         // bump its unread count and update preview text
                //         return prev.map((n) =>
                //             n.chat._id === newMessageRecieved.chat._id
                //                 ? {
                //                     ...n,
                //                     lastMessage: newMessageRecieved.content,
                //                     count: n.count + 1,
                //                 }
                //                 : n
                //         );
                //     }
                //     // first unread message for this chat — create a new entry
                //     return [
                //         {
                //             chat: newMessageRecieved.chat,
                //             sender: newMessageRecieved.sender,
                //             lastMessage: newMessageRecieved.content,
                //             count: 1,
                //         },
                //         ...prev,
                //     ];
                // });

                // tells MyChats to refetch, so this chat moves to the top
                // of the list with its updated latestMessage
                setFetchChatAgain((prev) => !prev);
            } else {
                // message belongs to the chat I'm currently viewing —
                // just append it straight to the visible list
                setMessages((prev) => [...prev, newMessageRecieved]);

                // NEW — if this is a system message about group membership
                // changing (add/remove/leave), the message's `chat` field
                // already carries the FRESH users array (populated on the
                // backend). Sync selectedChat with it so anyone else viewing
                // this group sees the updated member list immediately,
                // without needing to close/reopen the modal or refetch.
                if (
                    newMessageRecieved.messageType === "system" &&
                    newMessageRecieved.chat?.users
                ) {
                    setSelectedChat(newMessageRecieved.chat);
                }
            }
        };

        socket.on("message recieved", handleMessage);
        // cleanup: remove this exact listener when the effect re-runs,
        // otherwise old listeners pile up and messages get duplicated
        return () => socket.off("message recieved", handleMessage);
    }, [selectedChatCompare]);

    useEffect(() => {
        const handleNotification = (notification) => {
            // if I'm currently viewing this exact chat, immediately mark
            // it read server-side too, so the bell never shows a stale
            // unread count for something I'm actively looking at
            if (
                notification.type === "new_message" &&
                selectedChatCompare?._id === notification.chat?._id
            ) {
                axios.put(
                    `/api/notification/chat/${notification.chat._id}/read`,
                    {},
                    { headers: { Authorization: `Bearer ${user.token}` } }
                ).catch(() => { });
                return; // don't add it to the bell at all
            }

            setNotification((prev) => {
                // same row updated (count bumped) or a brand new one —
                // either way it's the newest activity now, so move it to
                // the front instead of leaving an updated row sitting
                // wherever it happened to be, keeping the bell newest-first
                const rest = prev.filter((n) => n._id !== notification._id);
                return [notification, ...rest];
            });
        };

        socket.on("notification", handleNotification);
        return () => socket.off("notification", handleNotification);
    }, [selectedChatCompare]);

    useEffect(() => {
        const handleNotificationRemoved = (notificationId) => {
            setNotification((prev) => prev.filter((n) => n._id !== notificationId));
        };

        socket.on("notification removed", handleNotificationRemoved);
        return () => socket.off("notification removed", handleNotificationRemoved);
    }, []);

    useEffect(() => {
        const handleDeletedForEveryone = (updatedMessage) => {
            if (selectedChatCompare?._id === updatedMessage.chat._id) {
                setMessages((prev) =>
                    prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
                );
            }
        };

        socket.on("message deleted", handleDeletedForEveryone);
        return () => socket.off("message deleted", handleDeletedForEveryone);
    }, [selectedChatCompare]);

    // sends the message currently typed in the input box
    const sendMessage = async () => {
        if (!newMessage) return;

        // save a copy BEFORE clearing the input, so we can restore it
        // if sending fails (connection removed, network error, etc)
        const messageToSend = newMessage;


        // NEW — cancel any pending typing-timeout timer before sending.
        // Without this, even after the message is sent, the leftover timer
        // from the last keystroke would still fire 3 seconds later and
        // emit a redundant "stop typing" — harmless functionally, but
        // unnecessary noise/emit after the fact
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        // tell everyone else in the room I've stopped typing, since
        // I'm about to actually send the message
        socket.emit("stop typing", selectedChat._id);
        // reset our own "am I typing" flag too — without this, typingHandler's
        // `if (!typing)` guard stays permanently false after the first
        // message, so it never re-emits "typing" for the next message
        setTyping(false);

        // NOTE: removed the duplicate "const messageToSend = newMessage"
        // that was previously declared again inside the try block —
        // it was shadowing the outer one, which is harmless here since
        // both had the same value, but it's redundant and confusing.
        // We now only declare it once, above, before the try/catch.
        setNewMessage(""); // clear input immediately for snappy feel

        try {
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

            // if a "not connected" notice was showing from a previous failed
            // attempt, and this message just went through successfully
            // (meaning the connection must have been restored), clear it
            setSystemNotice(null);

            // broadcast this message to the other participant(s) in real time
            socket.emit("new message", data);
            // add it to my own message list right away too
            setMessages((prev) => [...prev, data]);

            // update the chat list preview (latestMessage) so it shows
            // this new message without needing a full refetch
            setChats((prev) =>
                prev.map((chat) =>
                    chat._id === selectedChat._id
                        ? { ...chat, latestMessage: data }
                        : chat
                )
            );
        } catch (error) {
            // 403 specifically means the backend's connection gate blocked
            // this send (the other user removed the connection). Instead of
            // failing silently, or pushing a fake object into the real
            // `messages` array (which crashed ChatsLogic's sender-lookup
            // helpers earlier), we set a SEPARATE piece of state that
            // ChatMessages renders independently, outside the real
            // messages list — so it never interferes with sender/avatar
            // alignment logic.
            if (error.response?.status === 403) {
                setSystemNotice(
                    error.response?.data?.message ||
                    "You're no longer connected with this user. Reconnect to send messages."
                );
            }

            // give the user their typed message back so they don't lose it,
            // regardless of what kind of error occurred (403, network, etc)
            setNewMessage(messageToSend);
        }
    };

    // pressing Enter sends the message, same as clicking the send button
    const handleKeyDown = (e) => {
        if (e.key === "Enter") sendMessage();
    };

    // fires on every keystroke in the input box — handles emitting
    // "typing" / "stop typing" socket events with a debounce-style delay
    // const typingHandler = (e) => {
    //     setNewMessage(e.target.value);

    //     if (!socketConnected) return;

    //     // only emit "typing" once when I START typing, not on every keystroke
    //     if (!typing) {
    //         setTyping(true);
    //         socket.emit("typing", selectedChat._id);
    //     }

    //     // simple debounce: after 3 seconds of no new keystrokes, emit
    //     // "stop typing" — this timer resets every time this handler runs
    //     let lastTypingTime = new Date().getTime();
    //     var timerLength = 3000;

    //     setTimeout(() => {
    //         var timeNow = new Date().getTime();
    //         var timeDiff = timeNow - lastTypingTime;

    //         if (timeDiff >= timerLength && typing) {
    //             socket.emit("stop typing", selectedChat._id);
    //             setTyping(false);
    //         }
    //     }, timerLength);
    // };

    // NEW — holds the currently active "stop typing" timer's ID.
    // useRef (not useState) because this value never needs to show up
    // in the UI — it just needs to persist across renders so we can
    // cancel it later. Using useState here would cause unnecessary
    // re-renders every time the timer changes.
    const typingTimeoutRef = useRef(null);

    // fires on every keystroke in the input box — handles emitting
    // "typing" / "stop typing" socket events with a proper debounce
    // (previously: every keystroke created a NEW setTimeout without
    // cancelling the old one, so typing 5 characters left 5 separate
    // timers running — each one independently firing "stop typing"
    // 3 seconds after ITS OWN keystroke, which is why the console
    // showed "stop typing" repeated multiple times even while still
    // actively typing)
    const typingHandler = (e) => {
        setNewMessage(e.target.value);

        if (!socketConnected) return;

        // only emit "typing" once when I START typing, not on every keystroke
        if (!typing) {
            setTyping(true);
            socket.emit("typing", selectedChat._id);
        }

        // FIX — cancel whatever timer was running from the previous
        // keystroke before starting a new one. This guarantees only
        // ONE timer is ever alive at a time, no matter how fast someone
        // types.
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // start a fresh 3-second countdown — if no new keystroke comes
        // in before this fires, THAT'S when we know typing has actually
        // stopped, and emit "stop typing" exactly once
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop typing", selectedChat._id);
            setTyping(false);
        }, 3000);
    };

    return (
        <div className="w-full h-full flex flex-col">
            {selectedChat ? (
                <>
                    {/* Header — shows the other user's name (or group name),
              plus a profile/settings icon on the right */}
                    <div className="flex items-center justify-between w-full px-4 py-3 border-b border-nordic/40">
                        <div className="flex items-center gap-2">
                            {/* back button — only visible on mobile, returns to chat list */}
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

                        {/* 1:1 chat shows the other person's profile view,
                group chat shows the group settings/manage modal */}
                        {!selectedChat.isGroupChat ? (
                            <ProfileModal user={getSenderFullData(user, selectedChat.users)} />
                        ) : (
                            <UpdateGroupChatModal
                                fetchChatAgain={fetchChatAgain}
                                setFetchChatAgain={setFetchChatAgain}
                                fetchAllMessages={fetchAllMessages}
                                socket={socket}
                            />
                        )}
                    </div>

                    {/* Messages area */}
                    <div className="flex-1 flex flex-col bg-swan/60 overflow-hidden">
                        {loading ? (
                            // FIX: full-height spinner completely REPLACES the message
                            // list while a chat switch is in progress. Combined with
                            // clearing `messages` to [] in the effect above, this is
                            // what stops the previous chat's content from lingering
                            // on screen after you click a different conversation.
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 size={36} className="animate-spin text-cerulean" />
                            </div>
                        ) : (
                            <div className="messages flex-1">
                                <ChatMessages messages={messages} isTyping={isTyping} systemNotice={systemNotice} isGroupChat={selectedChat?.isGroupChat}
                                    socket={socket}
                                    onMessageDeletedForMe={(id) =>
                                        setMessages((prev) => prev.filter((m) => m._id !== id))
                                    }
                                    onMessageDeletedForEveryone={(updatedMessage) =>
                                        setMessages((prev) =>
                                            prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
                                        )
                                    } />
                            </div>
                        )}

                        {/* Message input row */}
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
                // shown when no chat is selected yet (e.g. right after login,
                // before clicking anyone in the chat list)
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