import { CloseIcon } from '@chakra-ui/icons'
import { Box, Text } from '@chakra-ui/react'
import React from 'react'

const UserListforGroup = ({ user, handleFunction }) => {
  return (
    <Box
      position="relative"
      px={4}
      py={2}
      m={1}
      borderRadius="lg"
      bg="purple.100"
      color="purple.800"
      fontSize="sm"
      cursor="pointer"
      minW="80px"
      _hover={{
        bg: "purple.200",
      }}
    >
      {/* close icon – top right */}
      <Box
        position="absolute"
        top="2px"
        right="6px"
        fontSize="7px"
        onClick={handleFunction}
        _hover={{ color: "purple.600" }}
      >
        <CloseIcon />
      </Box>

      {/* user name */}
      <Text fontWeight="bold">
        {user.name}
      </Text>
    </Box>
  )
}

export default UserListforGroup
