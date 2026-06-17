import React, { useEffect, useRef, useState } from "react";
import { ChatState } from "../../context/ChatProvider";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Bell,
    ChevronDown,
    LogOut,
    User,
    MessageCircle,
    X,
    Loader2,
} from "lucide-react";
import ProfileModal from "./profileModal";
import ChatLoading from "../Chatpage/ChatLoading";
import UserListItem from "../UserList/UserListItem";
import { getSender } from "../../config/ChatsLogic";

const SideBar = () => {
    const {
        user,
        setUser,
        setSelectedChat,
        chats,
        setChats,
        notification,
        setNotification,
    } = ChatState();

    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);

    const history = useHistory();
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    // close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target))
                setNotifOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target))
                setProfileOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            setSearchResult([]);
            setLoading(false);
        }
    }, [search]);

    const logoutHandler = () => {
        setUser(null);
        setChats([]);
        setSelectedChat(null);
        localStorage.removeItem("userInfo");
        history.push("/");
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setSearch("");
        setSearchResult([]);
        setLoading(false);
        setLoadingChat(false);
    };

    const handleSearch = async () => {
        if (!search) return;

        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`/api/user?search=${search}`, config);
            setLoading(false);
            setSearchResult(data);
        } catch (error) {
            setLoading(false);
        }
    };

    const accessChat = async (userId) => {
        try {
            setLoadingChat(true);
            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.post("/api/chat", { userId }, config);
            if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
            setSelectedChat(data);
            setLoadingChat(false);
            handleDrawerClose();
        } catch (error) {
            setLoadingChat(false);
        }
    };

    return (
        <>
            {/* ── Navbar ───────────────────────────────────────────── */}
            <header className="w-full h-16 bg-white border-b border-nordic/40 shadow-card
        flex items-center justify-between px-4 sm:px-6 z-40 sticky top-0">

                {/* Left — brand + search trigger */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-viridian rounded-lg flex items-center
              justify-center shadow-3d">
                            <MessageCircle size={16} className="text-white" />
                        </div>
                        <span className="font-display text-viridian text-xl hidden sm:block">
                            TalkSync
                        </span>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setDrawerOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-swan
              border border-nordic/60 text-saltwater text-sm
              hover:border-cerulean hover:text-viridian transition-all shadow-card"
                    >
                        <Search size={15} />
                        <span className="hidden sm:inline">Search users...</span>
                    </motion.button>
                </div>

                {/* Right — notifications + profile */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <div ref={notifRef} className="relative">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                setNotifOpen((v) => !v);
                                setProfileOpen(false);
                            }}
                            className="relative p-2.5 rounded-xl hover:bg-swan transition-colors"
                        >
                            <Bell size={20} className="text-viridian" />
                            {notification.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500
                  text-white text-[10px] font-bold rounded-full flex items-center
                  justify-center leading-none">
                                    {notification.length > 9 ? "9+" : notification.length}
                                </span>
                            )}
                        </motion.button>

                        <AnimatePresence>
                            {notifOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl
                    shadow-card-lg border border-nordic/40 z-50 overflow-hidden"
                                >
                                    <div className="px-4 py-3 border-b border-nordic/30">
                                        <p className="font-semibold text-sm text-viridian">
                                            Notifications
                                        </p>
                                    </div>

                                    {notification.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-sm text-saltwater">
                                            No new messages
                                        </div>
                                    ) : (
                                        <div className="max-h-72 overflow-y-auto">
                                            {notification.map((notify) => (
                                                <button
                                                    key={notify.chat._id}
                                                    onClick={() => {
                                                        setSelectedChat(notify.chat);
                                                        setNotification(
                                                            notification.filter(
                                                                (n) => n.chat._id !== notify.chat._id
                                                            )
                                                        );
                                                        setNotifOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3
                            hover:bg-swan transition-colors text-left"
                                                >
                                                    {/* avatar */}
                                                    <div className="w-9 h-9 rounded-full bg-nordic overflow-hidden
                            shrink-0 flex items-center justify-center">
                                                        {notify.sender.pic ? (
                                                            <img
                                                                src={notify.sender.pic}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-semibold text-viridian">
                                                                {notify.sender.name?.charAt(0)?.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-viridian truncate">
                                                            {notify.chat.isGroupChat
                                                                ? notify.chat.chatName
                                                                : getSender(user, notify.chat.users)}
                                                        </p>
                                                        <p className="text-xs text-saltwater truncate">
                                                            {notify.lastMessage}
                                                        </p>
                                                    </div>

                                                    {notify.count > 0 && (
                                                        <span className="text-[10px] font-bold bg-peacock text-white
                              rounded-full px-2 py-0.5 shrink-0">
                                                            {notify.count}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile menu */}
                    <div ref={profileRef} className="relative">
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                                setProfileOpen((v) => !v);
                                setNotifOpen(false);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl
                hover:bg-swan transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-nordic overflow-hidden
                flex items-center justify-center shadow-card">
                                {user.pic ? (
                                    <img
                                        src={user.pic}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-semibold text-viridian">
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <span className="text-sm font-semibold text-viridian hidden sm:block max-w-[100px] truncate">
                                {user.name}
                            </span>
                            <ChevronDown
                                size={14}
                                className={`text-saltwater transition-transform duration-200 hidden sm:block
                  ${profileOpen ? "rotate-180" : ""}`}
                            />
                        </motion.button>

                        <AnimatePresence>
                            {profileOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl
                    shadow-card-lg border border-nordic/40 z-50 overflow-hidden py-1"
                                >
                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            setProfileModalOpen(true);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                      text-viridian hover:bg-swan transition-colors"
                                    >
                                        <User size={15} className="text-saltwater" />
                                        My Profile
                                    </button>

                                    <div className="h-px bg-nordic/40 mx-3" />

                                    <button
                                        onClick={logoutHandler}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                      text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={15} />
                                        Logout
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Profile Modal */}
            {profileModalOpen && (
                <ProfileModal
                    user={user}
                    isOpen={profileModalOpen}
                    onClose={() => setProfileModalOpen(false)}
                />
            )}

            {/* ── Search Drawer ─────────────────────────────────────── */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleDrawerClose}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed left-0 top-0 h-full w-80 bg-white z-50
                shadow-card-lg flex flex-col"
                        >
                            {/* Drawer header */}
                            <div className="flex items-center justify-between px-5 py-4
                border-b border-nordic/40">
                                <div className="flex items-center gap-2">
                                    <Search size={16} className="text-peacock" />
                                    <h3 className="font-display text-viridian text-lg">
                                        Search Users
                                    </h3>
                                </div>
                                <button
                                    onClick={handleDrawerClose}
                                    className="p-1.5 rounded-lg hover:bg-swan text-saltwater
                    hover:text-viridian transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Search input */}
                            <div className="px-5 py-4 border-b border-nordic/30">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search
                                            size={15}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-saltwater"
                                        />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                            placeholder="Search by name or email..."
                                            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-swan
                        border border-nordic focus:outline-none focus:ring-2
                        focus:ring-cerulean transition-all placeholder:text-gray-400"
                                        />
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSearch}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white
                      bg-gradient-to-r from-peacock to-cerulean shadow-3d
                      hover:shadow-3d-hover transition-all"
                                    >
                                        Go
                                    </motion.button>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="flex-1 overflow-y-auto px-4 py-3">
                                {loading ? (
                                    <ChatLoading />
                                ) : searchResult.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {searchResult.map((u) => (
                                            <UserListItem
                                                key={u._id}
                                                user={u}
                                                handleFunction={() => accessChat(u._id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center
                    h-40 text-saltwater gap-2 text-sm">
                                        <Search size={28} className="text-nordic" />
                                        Search for people to chat with
                                    </div>
                                )}

                                {loadingChat && (
                                    <div className="flex justify-center mt-4">
                                        <Loader2 size={24} className="animate-spin text-cerulean" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default SideBar;