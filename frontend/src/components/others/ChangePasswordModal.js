import React, { useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
} from "@chakra-ui/react";
import axios from "axios";
import { ChatState } from "../../context/ChatProvider";
import { useToast } from '@chakra-ui/react'
import { motion, AnimatePresence } from "framer-motion";
import {
    Lock,
    Eye,
    EyeOff,
    Shield,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

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
    const [passwordStrength, setPasswordStrength] = useState(0);

    const handleShowOld = () => setShowOld(!showOld);
    const handleShowNew = () => setShowNew(!showNew);
    const handleShowConfirm = () => setShowConfirm(!showConfirm);

    // Password strength checker
    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]+/)) strength++;
        if (password.match(/[A-Z]+/)) strength++;
        if (password.match(/[0-9]+/)) strength++;
        if (password.match(/[$@#&!]+/)) strength++;
        setPasswordStrength(strength);
    };

    const handleNewPasswordChange = (e) => {
        const value = e.target.value;
        setNewPassword(value);
        checkPasswordStrength(value);
    };

    const getStrengthColor = () => {
        if (passwordStrength <= 2) return "bg-red-500";
        if (passwordStrength <= 3) return "bg-yellow-500";
        if (passwordStrength <= 4) return "bg-blue-500";
        return "bg-green-500";
    };

    const getStrengthText = () => {
        if (passwordStrength <= 2) return "Weak";
        if (passwordStrength <= 3) return "Fair";
        if (passwordStrength <= 4) return "Good";
        return "Strong";
    };

    const handleUpdatePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            toast({
                title: "Please fill all fields",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords do not match",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
            return;
        }

        if (passwordStrength <= 2) {
            toast({
                title: "Password is too weak",
                description: "Please use a stronger password with mix of letters, numbers, and special characters",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right",
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
                title: "Password updated successfully! 🔒",
                description: "Your password has been changed",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });

            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordStrength(0);
            onClose();
        } catch (error) {
            toast({
                title: error.response?.data?.message || "Something went wrong",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordStrength(0);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            isCentered
            size="md"
            motionPreset="slideInBottom"
        >
            <ModalOverlay backdropFilter="blur(4px)" bg="black/30" />

            <ModalContent
                className="bg-white rounded-2xl shadow-2xl overflow-hidden"
                border="none"
                maxW="460px"
                mx={4}
            >
                {/* Header with gradient accent */}
                <div className="relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-peacock to-cerulean" />
                    <ModalHeader className="flex items-center gap-3 pt-6 pb-2 px-6">
                        <div className="p-2.5 bg-viridian/10 rounded-xl">
                            <Lock size={22} className="text-viridian" />
                        </div>
                        <div>
                            <h2 className="font-display text-viridian text-2xl leading-tight">
                                Change Password
                            </h2>
                            <p className="text-sm text-saltwater font-normal">
                                Keep your account secure
                            </p>
                        </div>
                    </ModalHeader>
                    <ModalCloseButton className="mt-2 mr-2 text-saltwater hover:text-viridian hover:bg-swan/80 rounded-lg transition-all" />
                </div>

                <ModalBody className="px-6 py-5">
                    <div className="space-y-5">
                        {/* Old Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-viridian/80 flex items-center gap-2">
                                <Lock size={16} />
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showOld ? "text" : "password"}
                                    placeholder="Enter current password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-swan/60 border border-nordic/30 
                                    text-base text-viridian placeholder:text-saltwater/60
                                    focus:outline-none focus:ring-2 focus:ring-cerulean/40 focus:border-cerulean
                                    transition-all duration-200"
                                />
                                <button
                                    onClick={handleShowOld}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-saltwater 
                                    hover:text-viridian transition-colors"
                                    type="button"
                                >
                                    {showOld ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-viridian/80 flex items-center gap-2">
                                <Shield size={16} />
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? "text" : "password"}
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={handleNewPasswordChange}
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-swan/60 border border-nordic/30 
                                    text-base text-viridian placeholder:text-saltwater/60
                                    focus:outline-none focus:ring-2 focus:ring-cerulean/40 focus:border-cerulean
                                    transition-all duration-200"
                                />
                                <button
                                    onClick={handleShowNew}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-saltwater 
                                    hover:text-viridian transition-colors"
                                    type="button"
                                >
                                    {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {/* Password strength indicator */}
                            {newPassword.length > 0 && (
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="space-y-2 mt-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-swan rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                                                    className={`h-full rounded-full ${getStrengthColor()}`}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-saltwater min-w-[48px] text-right">
                                                {getStrengthText()}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { label: "8+ characters", check: newPassword.length >= 8 },
                                                { label: "Lowercase", check: /[a-z]/.test(newPassword) },
                                                { label: "Uppercase", check: /[A-Z]/.test(newPassword) },
                                                { label: "Number", check: /[0-9]/.test(newPassword) },
                                                { label: "Special character", check: /[$@#&!]/.test(newPassword) },
                                            ].map((req, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all
                                                        ${req.check
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-saltwater/10 text-saltwater/50"
                                                        }`}
                                                >
                                                    {req.check ? "✓" : "○"} {req.label}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-viridian/80 flex items-center gap-2">
                                <CheckCircle size={16} />
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-swan/60 border border-nordic/30 
                                    text-base text-viridian placeholder:text-saltwater/60
                                    focus:outline-none focus:ring-2 focus:ring-cerulean/40 focus:border-cerulean
                                    transition-all duration-200"
                                />
                                <button
                                    onClick={handleShowConfirm}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-saltwater 
                                    hover:text-viridian transition-colors"
                                    type="button"
                                >
                                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {/* Password match indicator */}
                            {confirmPassword.length > 0 && (
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2 mt-1.5"
                                    >
                                        {newPassword === confirmPassword ? (
                                            <>
                                                <CheckCircle size={16} className="text-green-500" />
                                                <span className="text-sm font-medium text-green-600">
                                                    Passwords match
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={16} className="text-red-500" />
                                                <span className="text-sm font-medium text-red-500">
                                                    Passwords don't match
                                                </span>
                                            </>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Security tip */}
                        <div className="flex items-start gap-3 p-4 bg-cerulean/5 rounded-xl border border-cerulean/10">
                            <Shield size={18} className="text-cerulean mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-viridian/80">Security tip</p>
                                <p className="text-sm text-viridian/60 leading-relaxed">
                                    Use a strong, unique password that you haven't used elsewhere.
                                    We recommend at least 8 characters with a mix of letters, numbers,
                                    and symbols.
                                </p>
                            </div>
                        </div>
                    </div>
                </ModalBody>

                <ModalFooter className="px-6 py-4 bg-swan/30 border-t border-nordic/20 gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 rounded-xl text-base font-semibold text-saltwater 
                        hover:text-viridian hover:bg-swan transition-all duration-200"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleUpdatePassword}
                        disabled={loading || !newPassword || !confirmPassword}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-peacock to-cerulean 
                        text-white text-base font-semibold shadow-3d hover:shadow-3d-hover 
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                        transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Updating...
                            </>
                        ) : (
                            <>
                                <Lock size={18} />
                                Update Password
                            </>
                        )}
                    </motion.button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ChangePasswordModal;