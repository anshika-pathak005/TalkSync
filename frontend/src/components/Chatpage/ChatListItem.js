import { Avatar, Box, Text } from "@chakra-ui/react";
import { ChatState } from "../../context/ChatProvider";
import { getSender } from "../../config/ChatsLogic";
import { HiUsers } from "react-icons/hi";

const ChatListItem = ({ chat }) => {
    const { user, selectedChat, setSelectedChat } = ChatState();

    // single chat me dusra user nikalna
    const otherUser =
        !chat.isGroupChat &&
        chat.users.find((u) => u._id !== user._id);

    return (
        <Box
            onClick={() => setSelectedChat(chat)}
            cursor="pointer"
            bg={selectedChat?._id === chat._id ? "purple.200" : "#E8E8E8"}
            color={selectedChat?._id === chat._id ? "black" : "black"}
            px={3}
            py={2}
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            // mb={1}
        >
            {/* LEFT SIDE */}
            <Box display="flex" alignItems="center">
                <Avatar
                    size="sm"
                    mr={2}
                    src={!chat.isGroupChat ? otherUser?.pic : ""}
                    bg={chat.isGroupChat ? "gray.400" : undefined}
                    color={chat.isGroupChat ? "white" : undefined}

                    icon={chat.isGroupChat ? <HiUsers size="18px" /> : undefined}
                />


                <Box>
                    {/* chat name */}
                    <Text fontWeight="bold" fontSize={"15px"}>
                        {!chat.isGroupChat
                            ? getSender(user, chat.users)
                            : chat.chatName}
                    </Text>

                    {/* last message */}
                    <Text fontSize="xs" color="gray.700" noOfLines={1}>
                        {chat.latestMessage
                            ? `${chat.latestMessage.sender.name}: ${chat.latestMessage.content}`
                            : ""}
                    </Text>
                </Box>
            </Box>

            {/* RIGHT SIDE (unread count – static for now) */}
            {chat.unreadCount > 0 && (
                <Box
                    bg="green.500"
                    color="white"
                    borderRadius="full"
                    px={2}
                    fontSize="xs"
                >
                    {chat.unreadCount}
                </Box>
            )}
        </Box>
    );
};

export default ChatListItem;