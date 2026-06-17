import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    Users,
    Plus,
    Search,
    UserPlus,
    Trash2,
    Loader2,
    Hash,
    UserCheck,
} from 'lucide-react'
import { useToast } from '@chakra-ui/react'
import { ChatState } from '../../context/ChatProvider'
import axios from 'axios'
import UserListItem from '../UserList/UserListItem'
import UserListforGroup from '../UserList/UserListforGroup'

const GroupChatModal = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [groupChatName, setGroupChatName] = useState("")
    const [selectedUsers, setSelectedUsers] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResult, setSearchResult] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchLoading, setSearchLoading] = useState(false)
    const toast = useToast()

    const { user, chats, setChats, setSelectedChat } = ChatState()

    // Reset all states
    const resetStates = () => {
        setGroupChatName("")
        setSelectedUsers([])
        setSearchQuery("")
        setSearchResult([])
        setLoading(false)
        setSearchLoading(false)
    }

    const handleOpen = () => {
        resetStates()
        setIsOpen(true)
    }

    const handleClose = () => {
        resetStates()
        setIsOpen(false)
    }

    // Clear search results when query is empty
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResult([])
        }
    }, [searchQuery])

    // Debounced search
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchQuery.trim()) {
                handleSearch(searchQuery)
            }
        }, 500)

        return () => clearTimeout(delayDebounce)
        // eslint-disable-next-line
    }, [searchQuery])

    const handleSearch = async (query) => {
        if (!query.trim()) return

        try {
            setSearchLoading(true)

            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                }
            }

            const { data } = await axios.get(`/api/user?search=${query}`, config)
            setSearchResult(data)
            setSearchLoading(false)

            if (data.length === 0) {
                toast({
                    title: "No users found",
                    description: `No users found for "${query}"`,
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                    position: "top-right",
                })
            }
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: "Failed to load search results",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top-right",
            })
            setSearchLoading(false)
        }
    }

    const createGroupChat = async () => {
        if (selectedUsers.length < 2) {
            toast({
                title: "Minimum 2 users required",
                description: "Please select at least 2 members for the group",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            })
            return
        }

        if (!groupChatName.trim()) {
            toast({
                title: "Group name required",
                description: "Please enter a name for your group",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            })
            return
        }

        try {
            setLoading(true)

            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                }
            }

            const { data } = await axios.post(
                "/api/chat/group",
                {
                    name: groupChatName,
                    users: JSON.stringify(selectedUsers.map((u) => u._id)),
                },
                config
            )

            setChats([data, ...chats])
            setSelectedChat(data)

            toast({
                title: "🎉 Group Created!",
                description: `"${groupChatName}" is ready to chat`,
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "top-right",
            })

            resetStates()
            handleClose()
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: error.response?.data?.message || "Failed to create the group",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top-right",
            })
            setLoading(false)
        }
    }

    const setUserToGroup = (userToAdd) => {
        if (selectedUsers.some((u) => u._id === userToAdd._id)) {
            toast({
                title: "User Already Added!",
                description: `${userToAdd.name} is already in the group`,
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            })
            return
        }

        setSelectedUsers([...selectedUsers, userToAdd])
    }

    const handleDelete = (deleteUser) => {
        setSelectedUsers(selectedUsers.filter((sel) => sel._id !== deleteUser._id))
    }

    return (
        <>
            {/* Trigger */}
            <span onClick={handleOpen} className="cursor-pointer">
                {children}
            </span>

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
                            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl 
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
                                                Create Group Chat
                                            </h2>
                                            <p className="text-sm text-saltwater font-normal">
                                                Add members and start chatting
                                            </p>
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
                                    {/* Group Name Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-viridian/80 flex items-center gap-2">
                                            <Hash size={16} />
                                            Group Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter group name..."
                                            value={groupChatName}
                                            onChange={(e) => setGroupChatName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-swan/60 border border-nordic/30 
                                                text-base text-viridian placeholder:text-saltwater/60
                                                focus:outline-none focus:ring-2 focus:ring-cerulean/40 focus:border-cerulean
                                                transition-all duration-200"
                                        />
                                    </div>

                                    {/* Search Section */}
                                    <div className="space-y-2">
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
                                                        handleFunction={() => setUserToGroup(user)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Members */}
                                    {selectedUsers.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-2.5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-viridian/80 flex items-center gap-2">
                                                    <UserCheck size={16} />
                                                    Members ({selectedUsers.length})
                                                </p>
                                                <span className="text-sm text-saltwater">
                                                    {selectedUsers.length < 2 ? "Need 2+ members" : "Ready to create"}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2 p-3 bg-swan/60 rounded-xl 
                                                border border-nordic/30 min-h-[56px]">
                                                {selectedUsers.map((u) => (
                                                    <UserListforGroup
                                                        key={u._id}
                                                        user={u}
                                                        handleFunction={() => handleDelete(u)}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Requirements Notice */}
                                    <div className="flex items-start gap-3 p-4 bg-cerulean/5 rounded-xl 
                                        border border-cerulean/10">
                                        <Users size={18} className="text-cerulean mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-viridian/80">Quick tip</p>
                                            <p className="text-sm text-viridian/60 leading-relaxed">
                                                Add at least 2 members to create a group. You can add more
                                                members later from the group settings.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-6 py-4 
                                    border-t border-nordic/30 bg-swan/50">
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-3 rounded-xl text-base font-semibold text-saltwater 
                                            hover:text-viridian hover:bg-swan transition-all duration-200"
                                    >
                                        Cancel
                                    </button>

                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={createGroupChat}
                                        disabled={loading || selectedUsers.length < 2 || !groupChatName.trim()}
                                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-peacock to-cerulean 
                                            text-white text-base font-semibold shadow-3d hover:shadow-3d-hover 
                                            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                                            transition-all duration-200 flex items-center gap-2.5"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={20} />
                                                Create Group
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

export default GroupChatModal