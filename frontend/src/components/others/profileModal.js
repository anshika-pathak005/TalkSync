// when user clicks on the avatar, it should show his profile details
// we will create a modal for that

import React from 'react'
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
} from '@chakra-ui/react'
import { ViewIcon } from '@chakra-ui/icons'
import {Image,Text} from "@chakra-ui/react";
import ChangePasswordModal from "./ChangePasswordModal";
import {
    Box,
    Spinner,
    useToast,
} from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { useRef, useState } from "react";
import axios from "axios";
import { ChatState } from "../../context/ChatProvider";


const ProfileModal = ({ user, children }) => {
    const { isOpen, onOpen, onClose } = useDisclosure()

    const {
        isOpen: isPwdOpen,
        onOpen: onPwdOpen,
        onClose: onPwdClose,
    } = useDisclosure();

    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const { setUser } = ChatState();

    const handleEditClick = () => {
        fileInputRef.current.click();
    };

    const postDetails = async (pics) => {
        if (!pics) return;

        if (pics.type !== "image/jpeg" && pics.type !== "image/png") {
            toast({
                title: "Only JPG/PNG images allowed",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const updateProfilePic = async (picUrl) => {
            try {
                const config = {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user.token}`,
                    },
                };

                const { data } = await axios.put(
                    "/api/user/update-pic",
                    { pic: picUrl },
                    config
                );

                setUser(data);
                localStorage.setItem("userInfo", JSON.stringify(data));

                toast({
                    title: "Profile picture updated",
                    status: "success",
                    duration: 3000,
                });

                setLoading(false);
            } catch (error) {
                setLoading(false);
                toast({
                    title: "Failed to update picture",
                    status: "error",
                });
            }
        };


        try {
            setLoading(true);

            const data = new FormData();
            data.append("file", pics);
            data.append("upload_preset", "TalkSync");
            data.append("cloud_name", "do0itnacu");

            const res = await fetch(
                "https://api.cloudinary.com/v1_1/do0itnacu/image/upload",
                {
                    method: "post",
                    body: data,
                }
            );

            const cloudData = await res.json();
            updateProfilePic(cloudData.url);
        } catch (error) {
            setLoading(false);
            toast({
                title: "Image upload failed",
                status: "error",
            });
        }
    };


    return (
        <>

            {/* // Use children as the modal trigger if provided, otherwise show a default "View Profile" button to open the modal.*/}
            {children ? (
                <span onClick={onOpen}>{children}</span>
            ) : (
                <IconButton d={{ base: "flex" }} icon={<ViewIcon />} onClick={onOpen}>View Profile</IconButton>
            )}

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader
                        fontSize="35px"
                        display="flex"
                        justifyContent="center"
                        textTransform="capitalize"
                    >{user.name}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {/* here we will hai user picture */}
                        {/* <Image
                            borderRadius="full"
                            boxSize="150px"
                            src={user.pic}
                            alt={user.name}
                            margin="auto"
                        /> */}

                        <Box position="relative" w="150px" mx="auto">
                            <Image
                                borderRadius="full"
                                boxSize="150px"
                                objectFit="cover"
                                src={user.pic}
                                alt={user.name}
                            />

                            {children && (
                                <>
                                    <IconButton
                                        icon={loading ? <Spinner size="sm" /> : <EditIcon />}
                                        size="sm"
                                        colorScheme="purple"
                                        position="absolute"
                                        bottom="5px"
                                        right="5px"
                                        borderRadius="full"
                                        onClick={handleEditClick}
                                        isDisabled={loading}
                                    />

                                    <input
                                        type="file"
                                        hidden
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={(e) => postDetails(e.target.files[0])}
                                    />
                                </>
                            )}

                            
                        </Box>


                        <Text
                            fontSize={{ base: "15px", md: "25px" }}
                            display="flex"
                            justifyContent="center"
                            marginTop="20px"
                        >
                            Email: {user.email}
                        </Text>

                       
                    </ModalBody>

                    <ChangePasswordModal
                        isOpen={isPwdOpen}
                        onClose={onPwdClose}
                    />

                    <ModalFooter justifyContent="space-between">
                        {children && (
                            <Button colorScheme="purple" mr={3} onClick={onPwdOpen}>
                                Change Password
                            </Button>
                        )}
                        
                        <Button colorScheme='purple' mr={3} onClick={onClose}>
                            Close
                        </Button>

                        
                        {/* <Button variant='ghost'>Secondary Action</Button> */}
                    </ModalFooter>
                    {/* <ChangePasswordModal
                        isOpen={isPwdOpen}
                        onClose={onPwdClose}
                    /> */}
                </ModalContent>
            </Modal>
        </>)
}

export default ProfileModal;