import React, { useEffect, useState } from 'react'
import { ChatState } from '../../context/ChatProvider'
import { Box, useToast, Button, Stack, Text } from '@chakra-ui/react';
import axios from 'axios';
import { AddIcon } from '@chakra-ui/icons'
import ChatLoading from './ChatLoading';
import { getSender } from '../../config/ChatsLogic'
import GroupChatModal from '../others/GroupChatModal'
import ChatListItem from './ChatListItem';


const MyChats = ({ fetchChatAgain, setFetchChatAgain }) => {

  const [loggedUser, setLoggedUser] = useState();
  const [loading, setLoading] = useState(false);
  // importing all of the contexts
  const { user, setUser, selectedChat, setSelectedChat, chats, setChats } = ChatState();
  const toast = useToast();

  // now in this chat list we will fetch and show all of the chats that this particular logged in user has, or i can say the chats this particular is the part of

  const fetchChats = async () => {
    // if user is not there do nothing
    if (!user) return;

    // make the api call to fetch all the chats
    try {
      setLoading(true);

      const config = {
        headers: {
          // "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      // console.log(data);
      setChats(data);
      setLoading(false);

    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Chats",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-left"
      })
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
  }, [fetchChatAgain]);
  // the above line means as soon as fetchchat changes , it is gonna fetch all the chats again

  return (
    // for the chatlist in the samller screens, if there is a selected chat then message window should be visible only, chat list window would disappear
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir={"column"}
      alignItems={"center"}
      p="3"
      bg="white"
      w={{ base: "100%", md: "31%" }}
      borderRadius={"lg"}
      borderWidth={"1px"}
    >
      {/* for header */}
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "25px", md: "28px" }}
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        Chats

        {/* this button will open group chat modal */}
        <GroupChatModal>

          <Button
            display="flex"
            // d={{ base: "none", md: "14px", lg: "15px" }}
            fontSize={{ base: "12px", md: "12px", lg: "15px" }}
            rightIcon={<AddIcon />}
          >
            New Group Chat
          </Button>
        </GroupChatModal>
      </Box>

      {/* now here display the all chat list */}
      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg="#F8F8F8"
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >

        {/* if chats are ther then display it , otherwise display loading skeleton */}
        {loading ? (
          <ChatLoading />
        ) : (
          // {chats ? (
          <Stack overflowY="scroll">
            {chats.filter((chat) =>
              chat.isGroupChat ||
              chat.users?.every((u) => u !== null)
            )
              .map((chat) => (
                <ChatListItem key={chat._id} chat={chat} />
              ))}

          </Stack>

          // ) : (
          //   <ChatLoading />
        )}
      </Box>

    </Box>
  )
}

export default MyChats
