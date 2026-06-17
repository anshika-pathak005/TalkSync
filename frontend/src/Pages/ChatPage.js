import React, { useState } from "react";
import { ChatState } from "../context/ChatProvider";
import SideBar from "../components/others/SideBar";
import MyChats from "../components/Chatpage/MyChats";
import Chatbox from "../components/Chatpage/Chatbox";

const ChatPage = () => {
    const { user } = ChatState();
    const [fetchChatAgain, setFetchChatAgain] = useState(false);

    return (
        <div className="w-full min-h-screen bg-swan flex flex-col">
            {user && <SideBar />}

            <div className="flex justify-between w-full h-[calc(100vh-4rem)] gap-3 p-3">
                {user && (
                    <MyChats
                        fetchChatAgain={fetchChatAgain}
                        setFetchChatAgain={setFetchChatAgain}
                    />
                )}

                {user && (
                    <Chatbox
                        fetchChatAgain={fetchChatAgain}
                        setFetchChatAgain={setFetchChatAgain}
                    />
                )}
            </div>
        </div>
    );
};

export default ChatPage;