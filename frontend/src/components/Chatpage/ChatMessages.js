import React, { useEffect, useRef } from "react";
import { Avatar, Box, Tooltip } from "@chakra-ui/react";
import { isSameSender, isLastMessage, isSameSenderMargin, isSameUser } from '../../config/ChatsLogic'
import { ChatState } from "../../context/ChatProvider";

const ChatMessages = ({ messages }) => {
    const messagesEndRef = useRef(null);

    const { user } = ChatState();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // console.log("MESSAGES ", messages);

    return (
        <Box
            display="flex"
            flexDirection="column"
            overflowY="auto"
            height="100%"
            padding={3}
        >
            
            {messages && messages.map((m, i) => (


                <div style={{ display: "flex" }} key={m._id}>

                    {/* if it is the last message of the same sender then show their pic */}
                    {(isSameSender(messages, m, i, user._id) ||
                        isLastMessage(messages, i, user._id))
                        &&
                        (
                            <Tooltip
                                label={m.sender.name}
                                placement="bottom-start"
                                hasArrow
                            >
                                <Avatar
                                    mt="7px"
                                    mr={1}
                                    size="sm"
                                    cursor="pointer"
                                    name={m.sender.name}
                                    src={m.sender.pic}
                                />
                            </Tooltip>
                        )}
                    <span
                        style={{
                            backgroundColor: `${m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                                }`,
                            marginLeft: isSameSenderMargin(messages, m, i, user._id),
                            marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                            borderRadius: "20px",
                            padding: "5px 15px",
                            maxWidth: "75%",
                        }}
                    >
                        {m.content}
                    </span>

                </div>

            ))}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
        </Box>
    );
};

export default ChatMessages;
