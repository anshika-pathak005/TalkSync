// here ill show each user in the search result as a list item
import React from 'react';
import { Box, Text, Avatar } from '@chakra-ui/react';
import { ChatState } from '../../context/ChatProvider';

const UserListItem = ({user, handleFunction}) => {

    return(
        <Box
            onClick={handleFunction}
            cursor="pointer"
            bg="#E8E8E8"
            _hover={{ background: "#805AD5", color: "white"}}
            w="100%"
            d="flex"
            alignItems="center"
            color="black"
            px={3}
            py={2}
            mb={2}
            borderRadius="lg"
            display="flex"
        >
            <Avatar
                size="sm"
                cursor="pointer"
                name={user.name}
                src={user.pic}
            >
            </Avatar>
            <Box ml={2}>
                <Text>{user.name}</Text>
                <Text fontSize="xs">
                    <b>Email : </b>
                    {user.email}
                </Text>
            </Box>
        </Box>
    )
}
export default UserListItem;