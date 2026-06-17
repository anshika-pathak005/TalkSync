import React, { useEffect, useState } from "react";
import { ChatState } from "../../context/ChatProvider";
import axios from "axios";
import { Plus, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "../others/GroupChatModal";
import ChatListItem from "./ChatListItem";

const MyChats = ({ fetchChatAgain }) => {
  const [loading, setLoading] = useState(false);
  const { user, selectedChat, chats, setChats } = ChatState();

  const fetchChats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get("/api/chat", config);
      setChats(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line
  }, [fetchChatAgain]);

  return (
    <div
      className={`${selectedChat ? "hidden" : "flex"} md:flex
        flex-col items-center w-full md:w-[31%]
        bg-white rounded-2xl shadow-card-lg border border-nordic/40 p-3`}
    >
      {/* Header */}
      {/* <div className="flex items-center justify-between w-full px-1 pb-3">
        <h2 className="font-display text-viridian text-2xl">Chats</h2>

        <GroupChatModal>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold
              text-white bg-gradient-to-r from-peacock to-cerulean
              px-3 py-2 rounded-xl shadow-3d hover:shadow-3d-hover transition-all"
          >
            <Plus size={14} />
            New Group
          </motion.button>
        </GroupChatModal>
      </div> */}

      {/* Header */}
      <div className="flex items-center justify-between w-full px-3 py-3 mb-1
  bg-gradient-to-r from-peacock/10 to-cerulean/5 
  rounded-xl border border-nordic/40">

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-peacock to-cerulean
      flex items-center justify-center shadow-3d">
            <MessageSquare size={15} className="text-white" />
          </div>
          <div>
            <h2 className="font-display text-viridian text-lg leading-none">Chats</h2>
            <p className="text-xs text-saltwater mt-0.5">
              {chats?.length || 0} conversation{chats?.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <GroupChatModal>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 text-xs font-semibold
        text-white bg-gradient-to-r from-peacock to-cerulean
        px-3 py-2 rounded-xl shadow-3d hover:shadow-3d-hover transition-all"
          >
            <Plus size={13} />
            New Group
          </motion.button>
        </GroupChatModal>
      </div>

      {/* Chat list */}
      <div className="flex flex-col w-full h-full bg-swan rounded-xl p-2.5 overflow-y-auto">
        {loading ? (
          <ChatLoading />
        ) : chats?.length ? (
          <div className="flex flex-col gap-2">
            {chats
              .filter(
                (chat) =>
                  chat.isGroupChat || chat.users?.every((u) => u !== null)
              )
              .map((chat) => (
                <ChatListItem key={chat._id} chat={chat} />
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-saltwater gap-2">
            <MessageSquare size={32} />
            <p className="text-sm">No chats yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyChats;