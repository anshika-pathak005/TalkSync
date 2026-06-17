import React from 'react';
import { motion } from 'framer-motion';
import { X, User, Crown } from 'lucide-react';
import { ChatState } from '../../context/ChatProvider';

const UserListforGroup = ({ user, handleFunction, isAdmin = false }) => {
  const { user: loggedInUser } = ChatState();
  const isSelf = loggedInUser?._id === user?._id;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.02 }}
      className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl 
                bg-gradient-to-r from-peacock/10 to-cerulean/10 
                border border-cerulean/20 hover:border-cerulean/40
                shadow-sm transition-all duration-200 group"
    >
      {/* Avatar/Initials */}
      <div className="flex-shrink-0">
        {user.pic ? (
          <img
            src={user.pic}
            alt={user.name}
            className="w-6 h-6 rounded-full object-cover border border-cerulean/20"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-peacock/30 to-cerulean/30 
                        flex items-center justify-center">
            <span className="text-xs font-display text-viridian font-semibold">
              {user.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* User Name */}
      <span className="text-sm font-semibold text-viridian">
        {user.name}
      </span>

      {/* Admin Crown */}
      {isAdmin && (
        <Crown
          size={12}
          className="text-yellow-500 flex-shrink-0"
          fill="currentColor"
        />
      )}

      {/* Self Indicator */}
      {isSelf && (
        <span className="text-[10px] font-medium text-saltwater bg-swan 
                    px-1.5 py-0.5 rounded-full border border-nordic/20">
          You
        </span>
      )}

      {/* Remove Button - Only show if handleFunction exists */}
      {handleFunction && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFunction();
          }}
          className="ml-1 p-0.5 rounded-full hover:bg-red-100 
                        transition-all duration-200 opacity-0 group-hover:opacity-100
                        focus:opacity-100"
          title="Remove from group"
        >
          <X size={14} className="text-saltwater hover:text-red-500 transition-colors" />
        </button>
      )}
    </motion.div>
  );
};

export default UserListforGroup;