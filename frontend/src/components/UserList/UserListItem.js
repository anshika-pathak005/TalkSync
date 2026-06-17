// here ill show each user in the search result as a list item
import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Plus, Check } from 'lucide-react';
import { ChatState } from '../../context/ChatProvider';

const UserListItem = ({ user, handleFunction, isSelected = false }) => {
    const { user: loggedInUser } = ChatState();
    const isSelf = loggedInUser?._id === user?._id;

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFunction}
            className={`group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl 
                transition-all duration-200 cursor-pointer
                ${isSelected
                    ? 'bg-gradient-to-r from-peacock/10 to-cerulean/10 border-2 border-cerulean/40 shadow-card'
                    : 'bg-white hover:bg-swan/80 border border-transparent hover:border-nordic/40'
                }
                shadow-sm hover:shadow-card`}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                {user.pic ? (
                    <img
                        src={user.pic}
                        alt={user.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-nordic/40 
                            group-hover:border-cerulean/60 transition-all duration-200"
                    />
                ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-peacock/20 to-cerulean/20 
                        flex items-center justify-center border-2 border-nordic/40 
                        group-hover:border-cerulean/60 transition-all duration-200">
                        <span className="text-lg font-display text-viridian font-semibold">
                            {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Online indicator - if you have online status */}
                {user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 
                        rounded-full border-2 border-white" />
                )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-viridian truncate">
                        {user.name}
                    </p>
                    {isSelf && (
                        <span className="text-[10px] font-medium text-saltwater bg-swan 
                            px-1.5 py-0.5 rounded-full border border-nordic/20">
                            You
                        </span>
                    )}
                    {user.isAdmin && (
                        <span className="text-[10px] font-medium text-peacock bg-peacock/10 
                            px-1.5 py-0.5 rounded-full border border-peacock/20">
                            Admin
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <Mail size={12} className="text-saltwater flex-shrink-0" />
                    <p className="text-sm text-saltwater truncate">
                        {user.email}
                    </p>
                </div>
            </div>

            {/* Action Icon */}
            <div className={`flex-shrink-0 transition-all duration-200
                ${isSelected
                    ? 'text-green-500'
                    : 'text-saltwater group-hover:text-cerulean'
                }`}>
                {isSelected ? (
                    <Check size={20} className="text-green-500" />
                ) : (
                    <Plus size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
        </motion.div>
    );
};

export default UserListItem;