// here ill show each user in the search result as a list item
import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2 } from 'lucide-react';
import { ChatState } from '../../context/ChatProvider';

// variant -> tailwind classes, so connectionAction from SideBar can just
// say "primary" / "outline" / "muted" without knowing any styling details
const VARIANT_STYLES = {
    primary:
        "bg-gradient-to-r from-peacock to-cerulean text-white shadow-3d hover:shadow-3d-hover",
    outline:
        "bg-white text-cerulean border border-cerulean/50 hover:bg-cerulean/5",
    muted:
        "bg-swan text-saltwater border border-nordic/40 cursor-default",
};

const UserListItem = ({ user, connectionAction, isSelected = false }) => {
    const { user: loggedInUser } = ChatState();
    const isSelf = loggedInUser?._id === user?._id;

    // fallback so the component doesn't crash if a caller forgets to
    // pass connectionAction — renders as a disabled, neutral button
    const action = connectionAction || {
        label: "—",
        variant: "muted",
        disabled: true,
        onClick: () => { },
    };

    const variantClass = VARIANT_STYLES[action.variant] || VARIANT_STYLES.muted;

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className={`group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl 
                transition-all duration-200
                ${isSelected
                    ? 'bg-gradient-to-r from-peacock/10 to-cerulean/10 border-2 border-cerulean/40 shadow-card'
                    : 'bg-white border border-transparent hover:border-nordic/40'
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

            {/* Action button — hidden entirely for your own row */}
            {!isSelf && (
                <motion.button
                    whileTap={action.disabled ? {} : { scale: 0.95 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!action.disabled) action.onClick();
                    }}
                    disabled={action.disabled}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                        text-xs font-semibold transition-all duration-200 whitespace-nowrap
                        ${variantClass}
                        ${action.disabled ? "opacity-70" : ""}`}
                >
                    {action.label === "Sending..." ||
                        action.label === "Cancelling..." ||
                        action.label === "Opening..." ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : null}
                    {action.label}
                </motion.button>
            )}
        </motion.div>
    );
};

export default UserListItem;