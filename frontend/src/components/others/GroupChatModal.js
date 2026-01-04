import React, { useState, useEffect } from 'react'
import { useDisclosure } from '@chakra-ui/hooks'
import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    IconButton,
    useToast,
    Input,
    FormControl,
    Box,
} from '@chakra-ui/react'
import { ViewIcon } from '@chakra-ui/icons'
import { Image, Text } from "@chakra-ui/react";
import { ChatState } from '../../context/ChatProvider';
import axios from 'axios';
import UserListItem from '../UserList/UserListItem';
import UserListforGroup from '../UserList/UserListforGroup';


const GroupChatModal = ({ children }) => {

    // const {user} = ChatState();
    const [groupChatName, setGroupChatName] = useState();
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState();
    const toast = useToast();

    // after creating the group we have to append it to the list of the chat that we already have and we have defined it in context

    const { user, chats, setChats, setSelectedChat } = ChatState();

    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResult([]);
        }
    }, [searchQuery]);


    const resetStates = () => {
        setGroupChatName("");
        setSelectedUsers([]);
        setSearchQuery("");
        setSearchResult([]);
        setLoading(false);
    };

    const handleClose = () => {
        resetStates();
        onClose();
    };


    const handleSearch = async (query) => {
        // // if serach box has nothing
        // if (!query) {
        //     toast({
        //         title: "Please Enter something to Search!",
        //         // description: `No users found for "${query}"`,
        //         status: "info",
        //         duration: 3000,
        //         isClosable: true,
        //         position: "bottom",
        //     });
        //     return
        // }

        try {
            // calling search api
            setLoading(true);

            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                }
            }

            const { data } = await axios.get(`/api/user?search=${query}`, config);

            console.log(data);

            setLoading(false);
            // now is data to set tto the serch resutl
            setSearchResult(data);

            if (data.length === 0) {
                toast({
                    title: "No users found!",
                    description: `No users found for "${query}"`,
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom",
                });
            }

        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: "Failed to Load the Search Results",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-left",
            });
            setLoading(false);
        }

    }

    // when user clicks create
    const createGroupChat = async () => {

        if (selectedUsers.length < 2) {
            toast({
                title: "Minimum 2 users required!",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            return;
        }


        if (!groupChatName || !selectedUsers) {
            toast({
                title: "Please fill all the fields!",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            return;
        }

        // do create chat api calling
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                }
            }

            const { data } = await axios.post("api/chat/group", {
                name: groupChatName,
                users: JSON.stringify(selectedUsers.map((u) => u._id)),
            }, config);

            // adding to the very top
            setChats([data, ...chats])
            toast({
                title: "New Group Chat created!",
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "bottom-left",
            });


            resetStates();
            onClose();


        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: "Failed to create the Group",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-left",
            });
            setLoading(false);
        }

    }

    const setUserToGroup = (userToAdd) => {

        // agr user pehle se ha to mat karo add
        if (selectedUsers.includes(userToAdd)) {
            toast({
                title: "User Already Added!",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "bottom-left",
            });
            return;
        }

        // otherwise do - means already present user ke ssath ise bhi add kar do
        setSelectedUsers([...selectedUsers, userToAdd]);

        // console.log(selectedUsers);

    }

    // removes the user from selectedUsers whose _id matches the deleteUser _id
    // means keep only those user who is not matching with the slected user id
    const handleDelete = (deleteUser) => {
        setSelectedUsers(selectedUsers.filter((sel) => sel._id !== deleteUser._id));
    }

    return (
        <>
            {/* clicking this children modal will open */}
            <span onClick={onOpen}>{children}</span>

            <Modal isOpen={isOpen} onClose={handleClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader
                        fontSize="26px"
                        display="flex"
                        justifyContent="center"
                        textTransform="capitalize"
                    >Create Group Chat</ModalHeader>
                    <ModalCloseButton />

                    <ModalBody
                        display={"flex"}
                        flexDirection={"column"}
                        alignItems={"center"}
                    >
                        {/* there will be 2 input fields  for chat nme and for searching the user to add to the grp*/}

                        <FormControl display="flex">
                            <Input
                                placeholder='Search User to add to the group...'
                                mb={3}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button
                                variant="solid"
                                colorScheme="purple"
                                ml={1}
                                isLoading={loading}
                                onClick={() => handleSearch(searchQuery)}
                                isDisabled={!searchQuery.trim()}

                            >
                                Search
                            </Button>
                        </FormControl>

                        {/* here render the list of user that added to the group */}

                        {/* here render the searched users */}
                        {/* and for that i wiil use already made component */}

                        {loading ? (
                            <div>loading...</div>
                        ) :
                            (
                                // here slice bcause only 4 result show at one time
                                // set to group function means, if user click the user, it should be added to the list of the user who will be going to part of the group
                                searchResult?.slice(0, 4).map((user) =>
                                    <UserListItem
                                        key={user._id}
                                        user={user}
                                        handleFunction={() => setUserToGroup(user)}
                                    />

                                )
                            )
                        }


                        {selectedUsers.length > 0 && (

                            <Box
                                width="100%"
                                mt={3}
                                mb={3}
                                p={2}
                                borderRadius="md"
                                bg="gray.50"
                                border="1px solid"
                                borderColor="gray.200"
                            >
                                <Text
                                    fontSize="sm"
                                    fontWeight="bold"
                                    color="gray.600"
                                    mb={2}
                                    textTransform="capitalize"
                                >
                                    group members -
                                </Text>

                                <Box
                                    display="flex"
                                    flexWrap="wrap"
                                    gap={2}
                                >
                                    {selectedUsers.map((u) => (
                                        <UserListforGroup
                                            key={u._id}
                                            user={u}
                                            handleFunction={() => handleDelete(u)}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* // {selectedUsers.length > 1 && ( */}
                        <FormControl>
                            <Input
                                placeholder='Enter the Group Name...'
                                mb={3}
                                onChange={(e) => { setGroupChatName(e.target.value) }}>

                            </Input>
                        </FormControl>
                        {/* // )} */}




                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme='purple' onClick={createGroupChat}>
                            Create
                        </Button>
                        {/* <Button variant='ghost'>Secondary Action</Button> */}
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}

export default GroupChatModal
