import React, { useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Button,
    Input,
    Stack,
    useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { ChatState } from "../../context/ChatProvider";
import {
    InputGroup,
    InputRightElement,
} from "@chakra-ui/react";


const ChangePasswordModal = ({ isOpen, onClose }) => {
    const toast = useToast();
    const { user } = ChatState();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleShowOld = () => setShowOld(!showOld);
    const handleShowNew = () => setShowNew(!showNew);
    const handleShowConfirm = () => setShowConfirm(!showConfirm);


    const handleUpdatePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            toast({
                title: "Please fill all fields",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords do not match",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            setLoading(true);

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };

            await axios.put(
                "/api/user/update-password",
                { oldPassword, newPassword },
                config
            );

            toast({
                title: "Password updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            onClose();
        } catch (error) {
            toast({
                title: error.response?.data?.message || "Something went wrong",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader textAlign={"center"}>Change Password</ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <Stack spacing={4}>
                        <InputGroup>
                            <Input
                                type={showOld ? "text" : "password"}
                                placeholder="Old Password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                            />
                            <InputRightElement width="4rem">
                                <Button h="1.5rem" size="sm" onClick={handleShowOld}>
                                    {showOld ? "Hide" : "Show"}
                                </Button>
                            </InputRightElement>
                        </InputGroup>


                        <InputGroup>
                            <Input
                                type={showNew ? "text" : "password"}
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <InputRightElement width="4rem">
                                <Button h="1.5rem" size="sm" onClick={handleShowNew}>
                                    {showNew ? "Hide" : "Show"}
                                </Button>
                            </InputRightElement>
                        </InputGroup>


                        <InputGroup>
                            <Input
                                type={showConfirm ? "text" : "password"}
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <InputRightElement width="4rem">
                                <Button h="1.5rem" size="sm" onClick={handleShowConfirm}>
                                    {showConfirm ? "Hide" : "Show"}
                                </Button>
                            </InputRightElement>
                        </InputGroup>

                    </Stack>
                </ModalBody>

                <ModalFooter >
                    <Button mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="purple"
                        isLoading={loading}
                        onClick={handleUpdatePassword}
                    >
                        Update
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ChangePasswordModal;
