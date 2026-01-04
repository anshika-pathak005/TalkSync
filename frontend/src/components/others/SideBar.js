import React, { useContext,useEffect } from "react";
import { Avatar, Box, Button, chakra, position, Tooltip, useToast, Spinner } from "@chakra-ui/react";
import { useState } from "react";
import { SearchIcon, ChevronDownIcon, BellIcon } from "@chakra-ui/icons";
import { Text } from "@chakra-ui/react";
import { ChatState } from "../../context/ChatProvider";
import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuItemOption,
    MenuGroup,
    MenuOptionGroup,
    MenuDivider,
} from "@chakra-ui/react";
import {
    Input,
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
} from "@chakra-ui/react";
import ProfileModal from "./profileModal";
import { useHistory } from "react-router-dom";
import { useDisclosure } from "@chakra-ui/react";
import axios from "axios";
import ChatLoading from "../Chatpage/ChatLoading";
import UserListItem from "../UserList/UserListItem";
import { warning } from "framer-motion";
import { getSender } from "../../config/ChatsLogic";
// import { Effect } from "react-notification-badge";
// import NotificationBadge, { Effect } from 'react-notification-badge';

const SideBar = () => {
    const { user, setUser, setSelectedChat, chats, setChats, notification, setNotification } = ChatState();

    // defining states and functions here
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const history = useHistory();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const btnRef = React.useRef();
    const toast = useToast();

    // as soon as user logs out, reset all the informations
    const logoutHandler = () => {
        setUser(null);
        setChats([]);
        setSelectedChat(null);
        localStorage.removeItem("userInfo");
        history.push("/");
    };

    const handleDrawerClose = () => {
        setSearch("");
        setSearchResult([]);
        setLoading(false);
        setLoadingChat(false);
        onClose();
    };

    useEffect(() => {
        if (!search.trim()) {
            setSearchResult([]);
            setLoading(false);
        }
    }, [search]);

    console.log(notification);

    // onClick={handleSearch}
    const handleSearch = async () => {
        // if no search input
        if (!search) {
            // toast warning
            toast({
                title: "Please enter something in search",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-left",
            });
            return;
        }

        // if there is search input then do api call of searching the user
        try {
            setLoading(true);
            // config for the api call
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.get(`/api/user?search=${search}`, config);
            console.log(data);
            setLoading(false);
            setSearchResult(data);
            if (data.length === 0) {
                toast({
                    title: "No users found!",
                    description: `No users found for "${search}"`,
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-left",
                });
            }
        }
        catch (error) {
            toast({
                title: "Error Occurred!",
                description: "Failed to Load the Search Results",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom-left",
            });
        }
    };

    // accessing the chat on clicking the user from the search list
    const accessChat = async (userId) => {
        // making api call to fetch the specific chat data
        try{
            setLoadingChat(true)
            const config = {
                headers : {
                    "Content-type" : "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const {data} = await axios.post("/api/chat",{userId},config);
            console.log(data);

            // if the chat is already present in the list , then just append it
            if (!chats.find((c) => c._id === data._id)) setChats([data,...chats]);

            // means this chat would be selected also, in case on the chat window we wanna show this one
            setSelectedChat(data)
            // this is going to be created in the context so that it can be accessible in whole app
            setLoadingChat(false);
            onClose();
            setSearch("");
            setSearchResult([]);

            }catch (error) {
                toast({
                    title:"Error fetching the Chat",
                    description:error.message,
                    status:error,
                    duration:3000,
                    isClosable:true,
                    position:"bottom-left"
                })
            }
        
    }

    return (
        <>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                bg="white"
                w="100%"
                p="5px 10px 5px 10px"
                borderWidth="5px"
            >
                {/* first serach bar */}
                <Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
                    <Button variant="ghost" onClick={onOpen}>
                        <SearchIcon />
                        <Text display={{ base: "none", md: "flex" }} px={4}>
                            Search User
                        </Text>
                    </Button>
                </Tooltip>

                {/* titile of the app */}
                <Text fontSize="3xl" fontWeight="bold">TalkSync</Text>

                {/* then menu for pfp and logout button */}
                <div>
                    <Menu>
                        {/* for notification icon */}
                        <MenuButton p={1}>
                            {/* <NotificationBadge
                            count={notification.length}
                            effect={Effect.SCALE}                            
                            /> */}

                            <Box position="relative">
                                <BellIcon fontSize="2xl" m={1} />
                                {notification.length > 0 && (
                                    <Box
                                        position="absolute"
                                        top="-1"
                                        right="-1"
                                        bg="red.600"
                                        color="white"
                                        borderRadius="full"
                                        fontSize="xs"
                                        px={2}
                                    >
                                        {notification.length}
                                    </Box>
                                )}
                            </Box>

                            {/* <BellIcon fontSize="2xl" m={1} /> */}
                        </MenuButton>
                        <MenuList pl={2}>
                            {/* if there is no notification */}
                            {!notification.length && "No New Messages"}

                            {/* otherwise populate them */}
                            {notification.map(notify => (
                                <MenuItem
                                    key={notify.chat._id}
                                    onClick={() => {
                                        setSelectedChat(notify.chat);
                                        setNotification(
                                            notification.filter((n) => n.chat._id !== notify.chat._id)
                                        );
                                    }}
                                    py={3}
                                    _hover={{ bg: "gray.100" }}
                                >
                                    <Box display="flex" alignItems="center" gap={3} w="100%">
                                        <Avatar
                                            size="sm"
                                            name={notify.sender.name}
                                            src={notify.sender.pic}
                                        />

                                        <Box flex="1">
                                            <Text fontWeight="semibold" fontSize="sm">
                                                {notify.chat.isGroupChat
                                                    ? notify.chat.chatName
                                                    : getSender(user, notify.chat.users)}
                                            </Text>

                                            <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                                {notify.lastMessage}
                                            </Text>
                                        </Box>

                                        {/* unread count badge */}
                                        <Box
                                            bg="purple.500"
                                            color="white"
                                            fontSize="xs"
                                            px={2}
                                            py={1}
                                            borderRadius="full"
                                            minW="20px"
                                            textAlign="center"
                                        >
                                            {notify.count}
                                        </Box>
                                    </Box>
                                </MenuItem>


                            ))}
                        </MenuList>
                    </Menu>
                    <Menu>
                        {/* for pfp */}
                        <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                            {/* Profile - here we will put the avatar as in image of the logged in user */}
                            <Avatar
                                size="sm"
                                cursor="pointer"
                                name={user.name}
                                src={user.pic}
                            />
                        </MenuButton>
                        <MenuList>
                            <ProfileModal user={user}>
                                <MenuItem>My Profile</MenuItem>
                            </ProfileModal>
                            <MenuDivider />
                            <MenuItem onClick={logoutHandler}>Logout</MenuItem>
                        </MenuList>
                    </Menu>
                </div>
            </Box>

            <Drawer
                isOpen={isOpen}
                placement="left"
                onClose={handleDrawerClose}
                finalFocusRef={btnRef}
            >
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader borderBottomWidth={"1px"}>Search Users</DrawerHeader>

                    <DrawerBody >
                        <Box display={"flex"} width={"100%"} mb="2">
                            <Input
                                mr="2"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by email or name..."
                            />
                            <Button ml="1" onClick={handleSearch}>
                                Go
                            </Button>
                        </Box>

                        {/* here ill display all of the search results */}
                        {/* if the data is being loaded then show loading otherwise the data */}

                        {loading ?
                            <ChatLoading />
                            : (
                                // now if the user data has been loaded then map through the data and show the user list
                                searchResult?.map((user) => (
                                    <UserListItem
                                        key={user._id}
                                        user={user}
                                        handleFunction={() => accessChat(user._id)}
                                    />
                                ))
 )}
                        {loadingChat && <Spinner ml="auto" display="flex"/>}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
};

export default SideBar;