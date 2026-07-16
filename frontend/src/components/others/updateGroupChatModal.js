import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    UserPlus,
    UserMinus,
    LogOut,
    Save,
    Edit2,
    Loader2,
    X,
    Crown,
    User,
    Search,
} from "lucide-react";
import { useToast } from "@chakra-ui/react";
import { ChatState } from "../../context/ChatProvider";
import UserListforGroup from "../UserList/UserListforGroup";
import axios from "axios";

// same lightweight picker row used in GroupChatModal — click to add
// directly (no toggle needed here, matches old "click search result
// to add" behavior)
const ConnectionAddRow = ({ person, onAdd, disabled }) => (
    <motion.div
        whileTap={disabled ? {} : { scale: 0.98 }}
        onClick={() => !disabled && onAdd()}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent
            transition-all duration-150
            ${disabled ? "opacity-60 cursor-default" : "cursor-pointer hover:border-nordic/40 hover:bg-swan/60 bg-white"}`}
    >
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-nordic/40
            flex items-center justify-center shrink-0 bg-gradient-to-br from-peacock/20 to-cerulean/20">
            {person.pic ? (
                <img src={person.pic} alt={person.name} className="w-full h-full object-cover" />
            ) : (
                <span className="text-sm font-display text-viridian font-semibold">
                    {person.name?.charAt(0)?.toUpperCase()}
                </span>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-viridian truncate">{person.name}</p>
            <p className="text-xs text-saltwater truncate">{person.email}</p>
        </div>
        <UserPlus size={16} className="text-cerulean shrink-0" />
    </motion.div>
);

const UpdateGroupChatModal = ({ fetchChatAgain, setFetchChatAgain, fetchAllMessages, socket }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [groupChatName, setGroupChatName] = useState("");
    const [renameLoading, setRenameLoading] = useState(false);
    const [addUserLoading, setAddUserLoading] = useState(null); // holds the userId being added
    const [leaveGroupLoading, setLeaveGroupLoading] = useState(false);
    const [removeUserLoading, setRemoveUserLoading] = useState(null); // holds the userId being removed

    // replaces old searchQuery/searchResult — now holds accepted
    // connections, filtered to exclude people already in this group
    const [connections, setConnections] = useState([]);
    const [connectionsLoading, setConnectionsLoading] = useState(false);
    const [filterQuery, setFilterQuery] = useState("");

    const toast = useToast();
    const { selectedChat, setSelectedChat, user } = ChatState();

    const authConfig = {
        headers: { Authorization: `Bearer ${user.token}` },
    };

    const fetchConnections = async () => {
        try {
            setConnectionsLoading(true);
            const { data } = await axios.get("/api/connection/my-connections", authConfig);
            setConnections(data);
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: "Failed to load your connections",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top-right",
            });
        } finally {
            setConnectionsLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        setGroupChatName("");
        setFilterQuery("");
        fetchConnections();
    };

    const handleClose = () => {
        setIsOpen(false);
        setGroupChatName("");
        setFilterQuery("");
        setConnections([]);
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

            const { data } = await axios.put(
                "/api/chat/groupRename",
                {
                    chatId: selectedChat._id,
                    chatName: groupChatName,
                },
                authConfig
            );

            setSelectedChat(data);
            setFetchChatAgain(!fetchChatAgain);
            setRenameLoading(false);

            toast({
                title: "Group Renamed!",
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

    // now hits the dedicated /api/chat/leave endpoint — any member
    // can call this (no admin check on the backend), unlike groupRemove
    const handleLeaveGroup = async () => {
        try {
            setLeaveGroupLoading(true);

            const { data } = await axios.put(          // <-- capture the response here
                "/api/chat/leave",
                { chatId: selectedChat._id },
                authConfig
            );

            // emit BEFORE clearing selectedChat/leaving, since you need
            // the chat object with its users array to know who to broadcast to
            socket.emit("new message", data.systemMessage);

            setSelectedChat();
            setFetchChatAgain(!fetchChatAgain);
            setLeaveGroupLoading(false);

            toast({
                title: "Left the group!",
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

    // adds a connection directly to the group — click-to-add, no
    // intermediate selection step, matching the old search-result flow
    const addUserToGroup = async (personToAdd) => {
        if (selectedChat.users.find((u) => u._id === personToAdd._id)) {
            toast({
                title: "User Already in group!",
                description: `${personToAdd.name} is already a member`,
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
            setAddUserLoading(personToAdd._id);

            const { data } = await axios.put(
                "/api/chat/groupAdd",
                {
                    chatId: selectedChat._id,
                    userId: personToAdd._id,
                },
                authConfig
            );

            setSelectedChat(data.chat);
            setFetchChatAgain(!fetchChatAgain);

            // NEW: broadcast the system message immediately, same shape as a
            // normal "new message" emit — reuses the exact server-side handler
            socket.emit("new message", data.systemMessage);

            toast({
                title: "User Added!",
                description: `${personToAdd.name} has been added to the group`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: error.response?.data?.message || "Failed to add user",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
        } finally {
            setAddUserLoading(null);
        }
    };

    // now hits /api/chat/groupRemove, which is admin-only on the
    // backend and returns { chat, systemMessage } instead of the raw chat
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
            setRemoveUserLoading(userToDelete._id);

            const { data } = await axios.put(
                "/api/chat/groupRemove",
                {
                    chatId: selectedChat._id,
                    userId: userToDelete._id,
                },
                authConfig
            );

            setSelectedChat(data.chat);
            setFetchChatAgain(!fetchChatAgain);
            fetchAllMessages(); // reloads messages, which now includes the new system message

            // NEW
            socket.emit("new message", data.systemMessage);

            toast({
                title: "User Removed!",
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
        } finally {
            setRemoveUserLoading(null);
        }
    };

    const isAdmin = selectedChat?.groupAdmin?._id === user?._id;

    // connections filtered to exclude existing group members, then
    // narrowed further by the local filter box (no API calls)
    const availableConnections = connections.filter(({ user: person }) => {
        const alreadyInGroup = selectedChat?.users?.some((u) => u._id === person._id);
        if (alreadyInGroup) return false;

        if (!filterQuery.trim()) return true;
        const q = filterQuery.toLowerCase();
        return (
            person.name?.toLowerCase().includes(q) ||
            person.email?.toLowerCase().includes(q)
        );
    });

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
                                                    {removeUserLoading === u._id && (
                                                        <div className="absolute inset-0 flex items-center justify-center
                                                            bg-white/70 rounded-full">
                                                            <Loader2 size={14} className="animate-spin text-cerulean" />
                                                        </div>
                                                    )}
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

                                    {/* Add Members Section - Only for Admins, sourced from Connections */}
                                    {isAdmin && (
                                        <div className="space-y-2.5">
                                            <label className="text-sm font-semibold text-viridian/80 flex items-center gap-2">
                                                <UserPlus size={16} />
                                                Add Members from Connections
                                            </label>

                                            {connections.length > 0 && (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Filter your connections..."
                                                        value={filterQuery}
                                                        onChange={(e) => setFilterQuery(e.target.value)}
                                                        className="w-full px-4 py-2.5 pl-10 rounded-xl bg-swan/60 border border-nordic/30 
                                                            text-sm text-viridian placeholder:text-saltwater/60
                                                            focus:outline-none focus:ring-2 focus:ring-cerulean/40 focus:border-cerulean
                                                            transition-all duration-200"
                                                    />
                                                    <Search
                                                        size={16}
                                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-saltwater"
                                                    />
                                                </div>
                                            )}

                                            <div className="max-h-52 overflow-y-auto border border-nordic/20 
                                                rounded-xl p-1.5 bg-swan/40">
                                                {connectionsLoading ? (
                                                    <div className="flex justify-center py-6">
                                                        <Loader2 size={20} className="animate-spin text-cerulean" />
                                                    </div>
                                                ) : availableConnections.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-6 gap-1.5
                                                        text-saltwater text-sm text-center px-4">
                                                        <Users size={22} className="text-nordic" />
                                                        {connections.length === 0
                                                            ? "You have no connections yet."
                                                            : "All your connections are already in this group."}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        {availableConnections.map(({ connectionId, user: person }) => (
                                                            <ConnectionAddRow
                                                                key={connectionId}
                                                                person={person}
                                                                disabled={addUserLoading === person._id}
                                                                onAdd={() => addUserToGroup(person)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
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
                                                        You can add members from your connections, remove
                                                        members, and rename the group. Click on any
                                                        member to remove them from the group.
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