import React from "react";
import { ChatState } from "../../context/ChatProvider";
import { getSender } from "../../config/ChatsLogic";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

const ChatListItem = ({ chat }) => {
    const { user, selectedChat, setSelectedChat } = ChatState();
    const isActive = selectedChat?._id === chat._id;

    const otherUser =
        !chat.isGroupChat && chat.users.find((u) => u._id !== user._id);

    const avatarSrc = !chat.isGroupChat ? otherUser?.pic : null;
    const initials = !chat.isGroupChat
        ? getSender(user, chat.users)?.charAt(0)?.toUpperCase()
        : chat.chatName?.charAt(0)?.toUpperCase();

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedChat(chat)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer
        transition-all duration-200
        ${isActive
                    ? "bg-gradient-to-r from-peacock to-cerulean text-white shadow-3d"
                    : "bg-white hover:bg-swan text-viridian shadow-card"
                }`}
        >
            <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden
            ${chat.isGroupChat
                            ? isActive
                                ? "bg-white/20"
                                : "bg-saltwater"
                            : isActive
                                ? "bg-white/20"
                                : "bg-nordic"
                        }`}
                >
                    {avatarSrc ? (
                        <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                    ) : chat.isGroupChat ? (
                        <Users size={18} className={isActive ? "text-white" : "text-white"} />
                    ) : (
                        <span className="text-sm font-semibold text-white">{initials}</span>
                    )}
                </div>

                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                        {!chat.isGroupChat ? getSender(user, chat.users) : chat.chatName}
                    </p>
                    <p
                        className={`text-xs truncate ${isActive ? "text-white/80" : "text-saltwater"
                            }`}
                    >
                        {chat.latestMessage
                            ? chat.latestMessage.messageType === "system"
                                ? chat.latestMessage.content
                                : `${chat.latestMessage.sender.name}: ${chat.latestMessage.content}`
                            : "No messages yet"}
                    </p>
                </div>
            </div>

            {chat.unreadCount > 0 && (
                <span
                    className={`text-xs font-semibold rounded-full px-2 py-0.5 shrink-0
            ${isActive ? "bg-white/25 text-white" : "bg-peacock text-white"}`}
                >
                    {chat.unreadCount}
                </span>
            )}
        </motion.div>
    );
};

export default ChatListItem;