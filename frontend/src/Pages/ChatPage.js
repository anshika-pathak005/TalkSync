import React, { useEffect,useState} from 'react'
import axios from 'axios';
import { ChatState } from '../context/ChatProvider';
import {Box} from '@chakra-ui/react';
import SideBar from '../components/others/SideBar';
import MyChats from '../components/Chatpage/MyChats';
import Chatbox from '../components/Chatpage/Chatbox';

const ChatPage = () => {

    const {user} = ChatState();
    const [fetchChatAgain, setFetchChatAgain] = useState();

    return (
        <div style={{width: "100%",}}>
            {/* <h1>Hey Anshika</h1> */}
            {user && <SideBar />}

            <Box
                display="flex"
                justifyContent="space-between"
                width="100%"
                height="91.5vh"
                padding="10px"
            >

                {user && <MyChats fetchChatAgain={fetchChatAgain} setFetchChatAgain={setFetchChatAgain}/>}

                {user && <Chatbox fetchChatAgain={fetchChatAgain} setFetchChatAgain={setFetchChatAgain}/>}

            </Box>

        </div>
    )
}

export default ChatPage
