import React, { useState } from "react";
import {
    Box,
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
    FormControl,
    Input,
    Spinner,
    Badge,
} from "@chakra-ui/react";
import { ViewIcon, CheckIcon } from "@chakra-ui/icons";
import { Image, Text } from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/hooks";
import { ChatState } from "../../context/ChatProvider";
import UserListItem from "../UserList/UserListItem";
import UserListforGroup from "../UserList/UserListforGroup";
import axios from "axios";

const UpdateGroupChatModal = ({ fetchChatAgain, setFetchChatAgain, fetchAllMessages }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [groupChatName, setGroupChatName] = useState("");
    const [renameLoading, setrenameLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [addUserLoading, setAddUserLoading] = useState(false);
    // const [removeUserLoading, setRemoveUserLoading] = useState(false);
    const [leaveGroupLoading, setLeaveGroupLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [search, setSearch] = useState();
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState();
    const toast = useToast();

    const { selectedChat, setSelectedChat, user } = ChatState();

    const handleModalOpen = () => {
        onOpen();
        setGroupChatName("");
        setSearchQuery("");
        setSearchResult([]);
    };

    const handleModalClose = () => {
        onClose();
        setGroupChatName("");
        setSearchQuery("");
        setSearchResult([]);
    };

    const handleRename = async () => {
        // if nothing there then return,

        if (!groupChatName) {
            toast({
                title: "Please enter a group name!",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            return;
        }

        try {
            // api call to rename
            setrenameLoading(true);

            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.put(
                "/api/chat/groupRename",
                {
                    chatId: selectedChat._id,
                    chatName: groupChatName,
                },
                config
            );

            // now updated chat will be shown in the list
            setSelectedChat(data);

            // fetching agian so that it would show the latest chats
            setFetchChatAgain(!fetchChatAgain);

            setrenameLoading(false);

            // success
            toast({
                title: "Group Renamed Successfully!",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });

            // onclose();
        } catch (error) {
            toast({
                title: "Failed Renaming the Group",
                description: error.response.data.message,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setrenameLoading(false);
        }
        setGroupChatName("");
    };

    const handleSearch = async (query) => {
        // if serach box has nothing
        if (!query) {
            return;
            // setSearchResult([]);
        }
        // setSearch(query);

        try {
            // calling search api
            setSearchLoading(true);

            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.get(`/api/user?search=${query}`, config);

            console.log(data);

            setSearchLoading(false);
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
                position: "bottom",
            });
            setSearchLoading(false);
        }
    };

    const handleLeaveGroup = async () => {
        try {
            setLeaveGroupLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.put(
                "/api/chat/groupRemove",
                {
                    chatId: selectedChat._id,
                    userId: user._id,
                },
                config
            );

            // User khud leave kar raha hai
            setSelectedChat();
            setFetchChatAgain(!fetchChatAgain);
            setLeaveGroupLoading(false);

            toast({
                title: "You left the group!",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });

            handleModalClose();
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: error.response?.data?.message || "Failed to leave group",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setLeaveGroupLoading(false);
        }
    };

    const addUserToGroup = async (userToAdd) => {
        // if user already present the show info
        if (selectedChat.users.find((u) => u._id === userToAdd._id)) {
            toast({
                title: "User Already in group!",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            return;
        }

        // is this user is admin only then he can add any person to the group
        if (selectedChat.groupAdmin._id !== user._id) {
            toast({
                title: "Only admins can add someone!",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            return;
        }

        // after checks then make api call to adding user to the grp
        try {
            setAddUserLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.put(
                "/api/chat/groupAdd",
                {
                    chatId: selectedChat._id,
                    userId: userToAdd._id,
                },
                config
            );

            // then this user we will set to the selected chat
            setSelectedChat(data);
            setFetchChatAgain(!fetchChatAgain);
            setAddUserLoading(false);
            toast({
                title: "User Added to the group!",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setSearchQuery("");
            setSearchResult([]);
        } catch (error) {
            toast({
                title: "Error Ocuured!",
                description: error.response.data.message,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setAddUserLoading(false);
        }
    };

    const handleDelete = async (userToDelete) => {
        // only admin can remove
        // if(selectedChat.groupAdmin._id !== user._id && userToDelete._id !== user._id){
        //     toast({
        //         title: "Only admins can remove someone!",
        //         status: "error",
        //         duration: 5000,
        //         isClosable: true,
        //         position: "bottom-left",
        //     });
        //     return;
        // }

        if (selectedChat.groupAdmin._id !== user._id) {
            toast({
                title: "Only admins can remove someone!",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-left",
            });
            return;
        }

        // Admin cannot remove themselves
        if (userToDelete._id === user._id) {
            toast({
                title: "You cannot remove yourself!",
                description: "Please use 'Leave Group' button instead.",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "bottom-left",
            });
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.put(
                "/api/chat/groupRemove",
                {
                    chatId: selectedChat._id,
                    userId: userToDelete._id,
                },
                config
            );

            // if user itself has logged out then we would remove him from the chat
            userToDelete._id === user._id ? setSelectedChat() : setSelectedChat(data);
            setFetchChatAgain(!fetchChatAgain);
            fetchAllMessages();
            setLoading(false);
            toast({
                title: "User Removed from group!",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: error.response?.data?.message || "Failed to remove user",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom",
            });
            setLoading(false);
        }
    };

    return (
        <div>
            <IconButton
                display={"flex"}
                onClick={handleModalOpen}
                icon={<ViewIcon />}
            />

            <Modal isOpen={isOpen} onClose={handleModalClose} isCentered size={'2xl'}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader
                        fontSize="35px"
                        display="flex"
                        flexDirection={"column"}
                        justifyContent="center"
                        alignItems={"center"}
                        textTransform="capitalize"
                    >
                        {selectedChat.chatName}
                        <Box
                            display="flex"
                            gap={2}
                            mt={2}
                            // pt={10}
                            // pr={5}
                            // pl={5}
                            p={5}
                            pb={1}

                            flexWrap="wrap"
                            justifyContent="space-between"
                            width={'100%'}
                        >
                            <Badge colorScheme="green" fontSize="sm" padding={2}>
                                {selectedChat.users.length} Members
                            </Badge>
                            <Badge colorScheme="purple" fontSize="sm" padding={2}>
                                Admin : {selectedChat.groupAdmin.name}
                            </Badge>
                        </Box>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {/* here show all the user currently in the group */}

                        <Box
                            width="100%"
                            mt={3}
                            mb={4}
                            p={2}
                            borderRadius="md"
                            bg="gray.50"
                            border="1px solid"
                            borderColor="gray.200"
                        >
                            <Text
                                fontSize="sm"
                                fontWeight="bold"
                                // color="gray.600"
                                mb={2}
                                textTransform="capitalize"
                            >
                                group members -
                            </Text>

                            <Box display="flex" flexWrap="wrap" gap={2}>
                                {selectedChat.users.map((u) => (
                                    <UserListforGroup
                                        key={u._id}
                                        user={u}
                                        handleFunction={() => handleDelete(u)}
                                    />
                                ))}
                            </Box>
                        </Box>

                        {/* then form control , input for rename chat, then adding the user to grp */}

                        <FormControl display="flex">
                            <Input
                                placeholder="New Chat Name"
                                mb={5}
                                value={groupChatName}
                                onChange={(e) => setGroupChatName(e.target.value)}
                            />
                            <Button
                                variant="solid"
                                colorScheme="purple"
                                ml={3}
                                isLoading={renameLoading}
                                onClick={handleRename}
                            >
                                Update
                            </Button>
                        </FormControl>

                        {selectedChat.groupAdmin._id === user._id && (
                            <>
                                <FormControl display={"flex"}>
                                    <Input
                                        placeholder="Search User to Add to group"
                                        mb={5}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Button
                                        variant="solid"
                                        colorScheme="purple"
                                        ml={3}
                                        isLoading={searchLoading}
                                        onClick={() => {
                                            handleSearch(searchQuery);
                                        }}
                                    >
                                        Search
                                    </Button>
                                </FormControl>
                                {/* show the searched users result */}

                                {addUserLoading ? (
                                    <Box display="flex" justifyContent="center" my={3}>
                                        <Spinner size="lg" />
                                    </Box>
                                ) : searchResult.length > 0 ? (
                                    searchResult
                                        ?.slice(0, 4)
                                        .map((user) => (
                                            <UserListItem
                                                key={user._id}
                                                user={user}
                                                handleFunction={() => addUserToGroup(user)}
                                            />
                                        ))
                                ) : null}
                            </>
                        )}
                    </ModalBody>

                    <ModalFooter justifyContent="space-between">
                        <Button
                            colorScheme="red"
                            onClick={handleLeaveGroup}
                            isLoading={leaveGroupLoading}
                        // leftIcon={<ViewIcon />}
                        >
                            Leave Group
                        </Button>
                        <Button
                            colorScheme="green"
                            onClick={handleModalClose}
                            rightIcon={<CheckIcon />}
                            isLoading={loading}
                            isDisabled={loading || renameLoading || searchLoading}
                        >
                            Save & Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default UpdateGroupChatModal;
