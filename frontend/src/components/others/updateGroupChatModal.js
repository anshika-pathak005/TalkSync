import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    UserPlus,
    UserMinus,
    LogOut,
    Save,
    Edit2,
    Search,
    Loader2,
    X,
    Crown,
    User,
    Hash,
} from "lucide-react";
import { useToast } from "@chakra-ui/react";
import { ChatState } from "../../context/ChatProvider";
import UserListItem from "../UserList/UserListItem";
import UserListforGroup from "../UserList/UserListforGroup";
import axios from "axios";

const UpdateGroupChatModal = ({ fetchChatAgain, setFetchChatAgain, fetchAllMessages }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [groupChatName, setGroupChatName] = useState("");
    const [renameLoading, setRenameLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [addUserLoading, setAddUserLoading] = useState(false);
    const [leaveGroupLoading, setLeaveGroupLoading] = useState(false);
    const [removeUserLoading, setRemoveUserLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const toast = useToast();

    const { selectedChat, setSelectedChat, user } = ChatState();

    // Clear search results when query is empty
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResult([]);
        }
    }, [searchQuery]);

    // Debounced search
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchQuery.trim()) {
                handleSearch(searchQuery);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
        // eslint-disable-next-line
    }, [searchQuery]);

    const handleOpen = () => {
        setIsOpen(true);
        setGroupChatName("");
        setSearchQuery("");
        setSearchResult([]);
    };

    const handleClose = () => {
        setIsOpen(false);
        setGroupChatName("");
        setSearchQuery("");
        setSearchResult([]);
    };

    const handleRename = async () => {
        if (!groupChatName.trim()) {
            toast({
                title: "Please enter a group name!",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
            return;
        }

        try {
            setRenameLoading(true);

            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.put(
                "/api/chat/groupRename",
                {
                    chatId: selectedChat._id,
                    chatName: groupChatName,
                },
                config
            );

            setSelectedChat(data);
            setFetchChatAgain(!fetchChatAgain);
            setRenameLoading(false);

            toast({
                title: "✨ Group Renamed!",
                description: `Group name updated to "${groupChatName}"`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });

            setGroupChatName("");
        } catch (error) {
            toast({
                title: "Failed Renaming the Group",
                description: error.response?.data?.message || "Something went wrong",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
            setRenameLoading(false);
        }
    };

    const handleSearch = async (query) => {
        if (!query.trim()) return;

        try {
            setSearchLoading(true);

            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.get(`/api/user?search=${query}`, config);
            setSearchResult(data);
            setSearchLoading(false);

            if (data.length === 0) {
                toast({
                    title: "No users found",
                    description: `No users found for "${query}"`,
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                    position: "top-right",
                });
            }
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: "Failed to load search results",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top-right",
            });
            setSearchLoading(false);
        }
    };

    const handleLeaveGroup = async () => {
        try {
            setLeaveGroupLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.put(
                "/api/chat/groupRemove",
                {
                    chatId: selectedChat._id,
                    userId: user._id,
                },
                config
            );

            setSelectedChat();
            setFetchChatAgain(!fetchChatAgain);
            setLeaveGroupLoading(false);

            toast({
                title: "👋 Left the group!",
                description: "You have successfully left the group",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });

            handleClose();
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: error.response?.data?.message || "Failed to leave group",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
            setLeaveGroupLoading(false);
        }
    };

    const addUserToGroup = async (userToAdd) => {
        if (selectedChat.users.find((u) => u._id === userToAdd._id)) {
            toast({
                title: "User Already in group!",
                description: `${userToAdd.name} is already a member`,
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
            return;
        }

        if (selectedChat.groupAdmin._id !== user._id) {
            toast({
                title: "Only admins can add someone!",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
            return;
        }

        try {
            setAddUserLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.put(
                "/api/chat/groupAdd",
                {
                    chatId: selectedChat._id,
                    userId: userToAdd._id,
                },
                config
            );

            setSelectedChat(data);
            setFetchChatAgain(!fetchChatAgain);
            setAddUserLoading(false);

            toast({
                title: "✅ User Added!",
                description: `${userToAdd.name} has been added to the group`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });

            setSearchQuery("");
            setSearchResult([]);
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: error.response?.data?.message || "Failed to add user",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
            setAddUserLoading(false);
        }
    };

    const handleDelete = async (userToDelete) => {
        if (selectedChat.groupAdmin._id !== user._id) {
            toast({
                title: "Only admins can remove someone!",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
            return;
        }

        if (userToDelete._id === user._id) {
            toast({
                title: "You cannot remove yourself!",
                description: "Please use 'Leave Group' button instead.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
            return;
        }

        try {
            setRemoveUserLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.put(
                "/api/chat/groupRemove",
                {
                    chatId: selectedChat._id,
                    userId: userToDelete._id,
                },
                config
            );

            setSelectedChat(data);
            setFetchChatAgain(!fetchChatAgain);
            fetchAllMessages();
            setRemoveUserLoading(false);

            toast({
                title: "🗑️ User Removed!",
                description: `${userToDelete.name} has been removed from the group`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: error.response?.data?.message || "Failed to remove user",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
            setRemoveUserLoading(false);
        }
    };

    const isAdmin = selectedChat?.groupAdmin?._id === user?._id;

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={handleOpen}
                className="p-2.5 rounded-xl bg-swan/60 hover:bg-swan 
                    text-saltwater hover:text-viridian transition-all duration-200
                    border border-nordic/30 hover:border-cerulean/40"
            >
                <Users size={20} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 28 }}
                            className="fixed inset-0 z-50 flex items-center justify-center px-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl 
                                border border-nordic/40 overflow-hidden max-h-[90vh] flex flex-col">

                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 
                                    border-b border-nordic/30 bg-gradient-to-r from-peacock/10 to-cerulean/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-viridian/10 rounded-xl">
                                            <Users size={22} className="text-viridian" />
                                        </div>
                                        <div>
                                            <h2 className="font-display text-viridian text-2xl leading-tight">
                                                {selectedChat?.chatName}
                                            </h2>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-sm text-saltwater flex items-center gap-1.5">
                                                    <Users size={14} />
                                                    {selectedChat?.users?.length} Members
                                                </span>
                                                {isAdmin && (
                                                    <span className="text-sm text-peacock flex items-center gap-1.5">
                                                        <Crown size={14} />
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="p-1.5 rounded-lg hover:bg-swan text-saltwater 
                                            hover:text-viridian transition-colors"
                                    >
                                        <X size={22} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                                    {/* Members List */}
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-semibold text-viridian/80 flex items-center gap-2">
                                            <User size={16} />
                                            Group Members
                                        </label>
                                        <div className="flex flex-wrap gap-2 p-3 bg-swan/60 rounded-xl 
                                            border border-nordic/30 min-h-[60px]">
                                            {selectedChat?.users?.map((u) => (
                                                <div key={u._id} className="relative">
                                                    <UserListforGroup
                                                        user={u}
                                                        handleFunction={() => handleDelete(u)}
                                                    />
                                                    {u._id === selectedChat?.groupAdmin?._id && (
                                                        <Crown
                                                            size={12}
                                                            className="absolute -top-1 -right-1 text-yellow-500"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Rename Section */}
                                    <div className="space-y-2.5">
                                        <label className="text-sm font-semibold text-viridian/80 flex items-center gap-2">
                                            <Edit2 size={16} />
                                            Rename Group
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder="Enter new group name..."
                                                value={groupChatName}
                                                onChange={(e) => setGroupChatName(e.target.value)}
                                                className="flex-1 px-4 py-3 rounded-xl bg-swan/60 border border-nordic/30 
                                                    text-base text-viridian placeholder:text-saltwater/60
                                                    focus:outline-none focus:ring-2 focus:ring-cerulean/40 focus:border-cerulean
                                                    transition-all duration-200"
                                            />
                                            <motion.button
                                                whileTap={{ scale: 0.97 }}
                                                onClick={handleRename}
                                                disabled={renameLoading || !groupChatName.trim()}
                                                className="px-5 py-3 rounded-xl bg-gradient-to-r from-peacock to-cerulean 
                                                    text-white text-base font-semibold shadow-3d hover:shadow-3d-hover 
                                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                                                    transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                                            >
                                                {renameLoading ? (
                                                    <Loader2 size={20} className="animate-spin" />
                                                ) : (
                                                    <Edit2 size={18} />
                                                )}
                                                Update
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Add Members Section - Only for Admins */}
                                    {isAdmin && (
                                        <div className="space-y-2.5">
                                            <label className="text-sm font-semibold text-viridian/80 flex items-center gap-2">
                                                <UserPlus size={16} />
                                                Add Members
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search users by name or email..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full px-4 py-3 pl-11 rounded-xl bg-swan/60 border border-nordic/30 
                                                        text-base text-viridian placeholder:text-saltwater/60
                                                        focus:outline-none focus:ring-2 focus:ring-cerulean/40 focus:border-cerulean
                                                        transition-all duration-200"
                                                />
                                                <Search
                                                    size={20}
                                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-saltwater"
                                                />
                                                {searchLoading && (
                                                    <Loader2
                                                        size={20}
                                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cerulean animate-spin"
                                                    />
                                                )}
                                            </div>

                                            {/* Search Results */}
                                            {searchResult.length > 0 && (
                                                <div className="mt-3 space-y-1.5 max-h-52 overflow-y-auto 
                                                    border border-nordic/20 rounded-xl p-1.5 bg-swan/40">
                                                    {searchResult.slice(0, 5).map((user) => (
                                                        <UserListItem
                                                            key={user._id}
                                                            user={user}
                                                            handleFunction={() => addUserToGroup(user)}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {addUserLoading && (
                                                <div className="flex justify-center py-4">
                                                    <Loader2 size={24} className="animate-spin text-cerulean" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Info Notice */}
                                    <div className="flex items-start gap-3 p-4 bg-cerulean/5 rounded-xl 
                                        border border-cerulean/10">
                                        {isAdmin ? (
                                            <>
                                                <Crown size={18} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-semibold text-viridian/80">Admin Controls</p>
                                                    <p className="text-sm text-viridian/60 leading-relaxed">
                                                        You can add or remove members, and rename the group.
                                                        Click on any member to remove them from the group.
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <User size={18} className="text-cerulean mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-semibold text-viridian/80">Member View</p>
                                                    <p className="text-sm text-viridian/60 leading-relaxed">
                                                        You're a member of this group. Only admins can add or remove members.
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-6 py-4 
                                    border-t border-nordic/30 bg-swan/50">
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={handleLeaveGroup}
                                        disabled={leaveGroupLoading}
                                        className="px-4 py-3 rounded-xl bg-red-50 text-red-600 
                                            hover:bg-red-100 transition-all duration-200
                                            flex items-center gap-2 text-base font-semibold
                                            border border-red-200 hover:border-red-300"
                                    >
                                        {leaveGroupLoading ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <LogOut size={18} />
                                        )}
                                        Leave Group
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={handleClose}
                                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-peacock to-cerulean 
                                            text-white text-base font-semibold shadow-3d hover:shadow-3d-hover 
                                            transition-all duration-200 flex items-center gap-2.5"
                                    >
                                        <Save size={18} />
                                        Save & Close
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default UpdateGroupChatModal;