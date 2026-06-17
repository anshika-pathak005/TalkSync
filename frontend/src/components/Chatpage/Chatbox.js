import React from "react";
import { ChatState } from "../../context/ChatProvider";
import SingleChat from "./singleChat";

const Chatbox = ({ fetchChatAgain, setFetchChatAgain }) => {
  const { selectedChat } = ChatState();

  return (
    <div
      className={`${selectedChat ? "flex" : "hidden"} md:flex
        flex-col items-center w-full md:w-[68%]
        bg-white rounded-2xl shadow-card-lg border border-nordic/40 overflow-hidden`}
    >
      <SingleChat
        fetchChatAgain={fetchChatAgain}
        setFetchChatAgain={setFetchChatAgain}
      />
    </div>
  );
};

export default Chatbox;