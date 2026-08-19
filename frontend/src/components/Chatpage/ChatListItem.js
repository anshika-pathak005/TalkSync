import React, { useRef, useState } from "react";
import { ChatState } from "../../context/ChatProvider";
import { getSender } from "../../config/ChatsLogic";
import { Users, MoreVertical, Trash2, UserCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ProfileModal from "../Profile/ProfileModal";

const ChatListItem = ({ chat }) => {
    const { user, selectedChat, setSelectedChat, chats, setChats } = ChatState();
    const isActive = selectedChat?._id === chat._id;

    // three-dot menu state — only relevant for 1:1 chats
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuDirection, setMenuDirection] = useState("down");
    const [profileOpen, setProfileOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const menuRef = useRef(null);

    const otherUser =
        !chat.isGroupChat && chat.users.find((u) => u._id !== user._id);

    const avatarSrc = !chat.isGroupChat ? otherUser?.pic : null;
    const initials = !chat.isGroupChat
        ? getSender(user, chat.users)?.charAt(0)?.toUpperCase()
        : chat.chatName?.charAt(0)?.toUpperCase();

    // close the menu if you click anywhere outside it
    React.useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggleMenu = (e) => {
        e.stopPropagation();
        if (deleting) return;

        if (!menuOpen) {
            if (menuRef.current) {
                const triggerRect = menuRef.current.getBoundingClientRect();
                const scrollContainer =
                    menuRef.current.closest(".overflow-y-auto") || document.body;
                const containerRect = scrollContainer.getBoundingClientRect();

                const spaceBelow = containerRect.bottom - triggerRect.bottom;
                const spaceAbove = triggerRect.top - containerRect.top;
                const MENU_HEIGHT = 95;

                if (spaceBelow < MENU_HEIGHT && spaceAbove > spaceBelow) {
                    setMenuDirection("up");
                } else {
                    setMenuDirection("down");
                }
            }
            setMenuOpen(true);
        } else {
            setMenuOpen(false);
        }
    };

    const handleDeleteChat = async (e) => {
        e.stopPropagation(); // don't let this also trigger setSelectedChat(chat)
        setMenuOpen(false);

        try {
            setDeleting(true);
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            await axios.delete(`/api/chat/delete/${chat._id}`, config);

            // remove it from the local list immediately — no need to
            // refetch, backend already recorded the per-user deletedAt
            setChats(chats.filter((c) => c._id !== chat._id));

            // if this was the currently open chat, close it too
            if (selectedChat?._id === chat._id) {
                setSelectedChat();
            }
        } catch (error) {
            console.log("Failed to delete chat", error);
        } finally {
            setDeleting(false);
        }
    };

    const handleViewProfile = (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        setProfileOpen(true);
    };

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedChat(chat)}
            className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer
        transition-all duration-200
        ${menuOpen ? "z-30" : "z-0"}
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
                    {/* <p
                        className={`text-xs truncate ${isActive ? "text-white/80" : "text-saltwater"
                            }`}
                    >
                        {chat.latestMessage
                            ? chat.latestMessage.messageType === "system"
                                ? chat.latestMessage.content
                                : `${chat.latestMessage.sender.name}: ${chat.latestMessage.content}`
                            : "No messages yet"}
                    </p> */}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {chat.unreadCount > 0 && (
                    <span
                        className={`text-xs font-semibold rounded-full px-2 py-0.5
              ${isActive ? "bg-white/25 text-white" : "bg-peacock text-white"}`}
                    >
                        {chat.unreadCount}
                    </span>
                )}

                {/* three-dot menu — 1:1 chats only, group chats already
            have their own settings icon (UpdateGroupChatModal) */}
                {!chat.isGroupChat && (
                    <div ref={menuRef} className="relative">
                        <button
                            onClick={toggleMenu}
                            disabled={deleting}
                            className={`p-1 rounded-lg transition-colors
        ${isActive ? "hover:bg-white/20" : "hover:bg-nordic/30"}
        ${deleting ? "cursor-not-allowed" : ""}`}
                        >
                            {deleting ? (
                                <Loader2
                                    size={16}
                                    className={`animate-spin ${isActive ? "text-white" : "text-saltwater"}`}
                                />
                            ) : (
                                <MoreVertical size={16} className={isActive ? "text-white" : "text-saltwater"} />
                            )}
                        </button>

                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: menuDirection === "up" ? 4 : -4, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: menuDirection === "up" ? 4 : -4, scale: 0.95 }}
                                    transition={{ duration: 0.12 }}
                                    className={`absolute right-0 w-44 bg-white rounded-xl
                    shadow-card-lg border border-nordic/40 z-50 overflow-hidden py-1 text-left
                    ${menuDirection === "up"
                                            ? "bottom-full mb-1 origin-bottom-right"
                                            : "top-full mt-1 origin-top-right"
                                        }`}
                                >
                                    <button
                                        onClick={handleViewProfile}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm
                      text-viridian hover:bg-swan transition-colors"
                                    >
                                        <UserCircle size={15} className="text-saltwater" />
                                        View Profile
                                    </button>

                                    <div className="h-px bg-nordic/40 mx-2.5" />

                                    <button
                                        onClick={handleDeleteChat}
                                        disabled={deleting}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm
                      text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                                    >
                                        <Trash2 size={15} />
                                        {deleting ? "Deleting..." : "Delete Chat"}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* view profile modal for the other user in this chat */}
            {otherUser && profileOpen && (
                <ProfileModal
                    user={otherUser}
                    isOpen={profileOpen}
                    onClose={() => setProfileOpen(false)}
                />
            )}
        </motion.div>
    );
};

export default ChatListItem;