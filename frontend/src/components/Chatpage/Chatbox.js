import React from 'react'
import { ChatState } from '../../context/ChatProvider'
import {Box} from '@chakra-ui/react'
import SingleChat from './singleChat'


const Chatbox = ({ fetchChatAgain, setFetchChatAgain }) => {

  const { selectedChat } = ChatState();

  return (
    <Box
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="center"
      flexDir="column"
      p={3}
      // bg="white"
      w={{ base: "100%", md: "68%" }}
      borderRadius="lg"
      borderWidth="1px"
      backgroundColor= "#fff"
    >
      <SingleChat fetchChatAgain={fetchChatAgain} setFetchChatAgain={setFetchChatAgain} />
    </Box>
  );
};

export default Chatbox;
