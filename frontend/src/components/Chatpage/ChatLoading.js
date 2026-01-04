// here ill define the loading component for chat page
import React from 'react';
import { Spinner, Stack, Skeleton } from '@chakra-ui/react';

const ChatLoading = () => {
    return(
        <Stack>
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
        </Stack>
    )
}

export default ChatLoading;