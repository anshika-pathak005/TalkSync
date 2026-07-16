import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    Users,
    Plus,
    Search,
    Trash2,
    Loader2,
    Hash,
    UserCheck,
    Check,
} from 'lucide-react'
import { useToast } from '@chakra-ui/react'
import { ChatState } from '../../context/ChatProvider'
import axios from 'axios'
import UserListforGroup from '../UserList/UserListforGroup'

// small local component — renders one connection row with a
// tap-to-toggle check, used only inside this modal's member picker.
// (Not UserListItem, since that component now renders connection
// actions like Connect/Message — here every row is already an
// accepted connection, we just need select/deselect.)
const ConnectionPickerRow = ({ person, isSelected, onToggle }) => (
    <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onToggle}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
            transition-all duration-150 border
            ${isSelected
                ? 'bg-gradient-to-r from-peacock/10 to-cerulean/10 border-cerulean/40'
                : 'bg-white border-transparent hover:border-nordic/40 hover:bg-swan/60'
            }`}
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

        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
            ${isSelected
                ? 'bg-gradient-to-r from-peacock to-cerulean border-transparent'
                : 'border-nordic/50'
            }`}>
            {isSelected && <Check size={13} className="text-white" />}
        </div>
    </motion.div>
)

const GroupChatModal = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [groupChatName, setGroupChatName] = useState("")
    const [selectedUsers, setSelectedUsers] = useState([])
    const [loading, setLoading] = useState(false)

    // replaces old searchResult/searchLoading — now holds the
    // logged-in user's accepted connections, fetched once on open
    const [connections, setConnections] = useState([])
    const [connectionsLoading, setConnectionsLoading] = useState(false)

    // local-only filter — narrows the fetched list, no API calls
    const [filterQuery, setFilterQuery] = useState("")

    const toast = useToast()
    const { user, chats, setChats, setSelectedChat } = ChatState()

    const resetStates = () => {
        setGroupChatName("")
        setSelectedUsers([])
        setFilterQuery("")
        setConnections([])
        setLoading(false)
        setConnectionsLoading(false)
    }

    const fetchConnections = async () => {
        try {
            setConnectionsLoading(true)
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            }
            const { data } = await axios.get("/api/connection/my-connections", config)
            setConnections(data)
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: "Failed to load your connections",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top-right",
            })
        } finally {
            setConnectionsLoading(false)
        }
    }

    const handleOpen = () => {
        resetStates()
        setIsOpen(true)
        fetchConnections()
    }

    const handleClose = () => {
        resetStates()
        setIsOpen(false)
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
                title: "Group Created!",
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

    // toggles a connection in/out of the selected members list
    const toggleUser = (person) => {
        setSelectedUsers((prev) => {
            const alreadySelected = prev.some((u) => u._id === person._id)
            if (alreadySelected) {
                return prev.filter((u) => u._id !== person._id)
            }
            return [...prev, person]
        })
    }

    const handleDelete = (deleteUser) => {
        setSelectedUsers(selectedUsers.filter((sel) => sel._id !== deleteUser._id))
    }

    // client-side filter over the already-fetched connections list
    const visibleConnections = connections.filter(({ user: person }) => {
        if (!filterQuery.trim()) return true
        const q = filterQuery.toLowerCase()
        return (
            person.name?.toLowerCase().includes(q) ||
            person.email?.toLowerCase().includes(q)
        )
    })

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

                                    {/* Members picker — pulled from accepted connections only */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-viridian/80 flex items-center gap-2">
                                                <UserCheck size={16} />
                                                Add Members from Connections
                                            </label>
                                            {selectedUsers.length > 0 && (
                                                <span className="text-xs text-saltwater">
                                                    {selectedUsers.length} selected
                                                </span>
                                            )}
                                        </div>

                                        {/* optional local filter — no API call, just narrows the list below */}
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

                                        {/* Connections list */}
                                        <div className="max-h-56 overflow-y-auto border border-nordic/20 
                                            rounded-xl p-1.5 bg-swan/40">
                                            {connectionsLoading ? (
                                                <div className="flex justify-center py-6">
                                                    <Loader2 size={20} className="animate-spin text-cerulean" />
                                                </div>
                                            ) : connections.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-6 gap-1.5
                                                    text-saltwater text-sm text-center px-4">
                                                    <Users size={22} className="text-nordic" />
                                                    You have no connections yet. Connect with people
                                                    first to add them to a group.
                                                </div>
                                            ) : visibleConnections.length === 0 ? (
                                                <div className="flex items-center justify-center py-6 text-sm text-saltwater">
                                                    No matches for "{filterQuery}"
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    {visibleConnections.map(({ connectionId, user: person }) => (
                                                        <ConnectionPickerRow
                                                            key={connectionId}
                                                            person={person}
                                                            isSelected={selectedUsers.some((u) => u._id === person._id)}
                                                            onToggle={() => toggleUser(person)}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
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
                                                Add at least 2 members to create a group. Only your
                                                accepted connections can be added — connect with
                                                someone first if you don't see them here.
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