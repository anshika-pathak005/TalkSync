import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Edit2, Loader2, Mail, User, KeyRound } from "lucide-react";
import axios from "axios";
import { ChatState } from "../../context/ChatProvider";
import ChangePasswordModal from "./ChangePasswordModal";

const ProfileModal = ({ user, children, isOpen: controlledOpen, onClose: controlledClose }) => {
    // support both controlled (from SideBar) and uncontrolled (children trigger) usage
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const onOpen = () => setInternalOpen(true);
    const onClose = controlledClose || (() => setInternalOpen(false));

    const [pwdOpen, setPwdOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const fileInputRef = useRef(null);
    const { setUser } = ChatState();

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const postDetails = async (pics) => {
        if (!pics) return;
        if (pics.type !== "image/jpeg" && pics.type !== "image/png") {
            showMessage("warning", "Only JPG/PNG images allowed");
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("file", pics);
            formData.append("upload_preset", "TalkSync");
            formData.append("cloud_name", "do0itnacu");

            const res = await fetch(
                "https://api.cloudinary.com/v1_1/do0itnacu/image/upload",
                { method: "post", body: formData }
            );
            const cloudData = await res.json();

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.put(
                "/api/user/update-pic",
                { pic: cloudData.url },
                config
            );

            setUser(data);
            localStorage.setItem("userInfo", JSON.stringify(data));
            showMessage("success", "Profile picture updated!");
            setLoading(false);
        } catch (error) {
            setLoading(false);
            showMessage("error", "Failed to update picture");
        }
    };

    // is this the logged-in user's own profile?
    const { user: loggedInUser } = ChatState();
    const isOwnProfile = loggedInUser?._id === user?._id;

    return (
        <>
            {/* Trigger */}
            {children && (
                <span onClick={onOpen} className="cursor-pointer">
                    {children}
                </span>
            )}

            {/* if no children and no controlled open — show eye icon trigger */}
            {!children && controlledOpen === undefined && (
                <button
                    onClick={onOpen}
                    className="p-2 rounded-lg hover:bg-swan text-saltwater
            hover:text-viridian transition-colors"
                >
                    <Eye size={18} />
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 28 }}
                            className="fixed inset-0 z-50 flex items-center justify-center px-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-full max-w-sm bg-white rounded-2xl shadow-card-lg
                border border-nordic/40 overflow-hidden">

                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4
                  border-b border-nordic/30 bg-gradient-to-r from-peacock/10 to-cerulean/5">
                                    <h2 className="font-display text-viridian text-xl">
                                        {isOwnProfile ? "My Profile" : `${user.name}'s Profile`}
                                    </h2>
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 rounded-lg hover:bg-swan text-saltwater
                      hover:text-viridian transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="px-6 py-6 flex flex-col items-center gap-5">
                                    {/* Toast message */}
                                    {message && (
                                        <div className={`w-full text-sm px-4 py-2 rounded-lg text-center font-medium
                      ${message.type === "error" ? "bg-red-100 text-red-700" : ""}
                      ${message.type === "success" ? "bg-green-100 text-green-700" : ""}
                      ${message.type === "warning" ? "bg-yellow-100 text-yellow-700" : ""}
                    `}>
                                            {message.text}
                                        </div>
                                    )}

                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="w-28 h-28 rounded-full overflow-hidden border-4
                      border-nordic shadow-card-lg bg-swan flex items-center justify-center">
                                            {user.pic ? (
                                                <img
                                                    src={user.pic}
                                                    alt={user.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-4xl font-display text-viridian">
                                                    {user.name?.charAt(0)?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Edit button — only on own profile */}
                                        {isOwnProfile && (
                                            <button
                                                onClick={() => fileInputRef.current.click()}
                                                disabled={loading}
                                                className="absolute bottom-1 right-1 w-8 h-8 rounded-full
                          bg-gradient-to-br from-peacock to-cerulean text-white
                          flex items-center justify-center shadow-3d
                          hover:shadow-3d-hover transition-all disabled:opacity-70"
                                            >
                                                {loading ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Edit2 size={14} />
                                                )}
                                            </button>
                                        )}

                                        <input
                                            type="file"
                                            hidden
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={(e) => postDetails(e.target.files[0])}
                                        />
                                    </div>

                                    {/* Info cards */}
                                    <div className="w-full flex flex-col gap-3">
                                        <div className="flex items-center gap-3 px-4 py-3 bg-swan
                      rounded-xl border border-nordic/40">
                                            <User size={16} className="text-peacock shrink-0" />
                                            <div>
                                                <p className="text-xs text-saltwater">Full name</p>
                                                <p className="text-sm font-semibold text-viridian capitalize">
                                                    {user.name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 px-4 py-3 bg-swan
                      rounded-xl border border-nordic/40">
                                            <Mail size={16} className="text-cerulean shrink-0" />
                                            <div>
                                                <p className="text-xs text-saltwater">Email address</p>
                                                <p className="text-sm font-semibold text-viridian">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-6 py-4
                  border-t border-nordic/30 bg-swan/50">
                                    {isOwnProfile && (
                                        <button
                                            onClick={() => setPwdOpen(true)}
                                            className="flex items-center gap-2 text-sm font-semibold
                        text-cerulean hover:text-viridian transition-colors"
                                        >
                                            <KeyRound size={15} />
                                            Change Password
                                        </button>
                                    )}

                                    <button
                                        onClick={onClose}
                                        className={`${isOwnProfile ? "" : "ml-auto"} px-4 py-2 rounded-xl
                      text-sm font-semibold text-white
                      bg-gradient-to-r from-peacock to-cerulean
                      shadow-3d hover:shadow-3d-hover transition-all`}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={pwdOpen}
                onClose={() => setPwdOpen(false)}
            />
        </>
    );
};

export default ProfileModal;