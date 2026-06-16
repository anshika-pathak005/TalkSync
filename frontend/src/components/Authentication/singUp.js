import React, { useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { motion } from "framer-motion";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ImagePlus,
    CheckCircle2,
} from "lucide-react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { ChatState } from "../../context/ChatProvider";

const SignUp = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pic, setPic] = useState("");
    const [picName, setPicName] = useState("");

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Create account");
    const [message, setMessage] = useState(null);

    const history = useHistory();
    const { setUser } = ChatState();

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const validate = () => {
        const errs = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!name) errs.name = "Name is required";
        if (!email) errs.email = "Email is required";
        else if (!emailRegex.test(email)) errs.email = "Enter a valid email address";
        if (!password) errs.password = "Password is required";
        if (!confirmPassword) errs.confirmPassword = "Please confirm your password";
        else if (password !== confirmPassword)
            errs.confirmPassword = "Passwords do not match";

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const submitHandler = async () => {
        if (!validate()) return;

        setLoading(true);
        setLoadingText("Registering...");

        try {
            const config = { headers: { "Content-type": "application/json" } };
            const { data } = await axios.post(
                "/api/user",
                { name, email, password, pic },
                config
            );

            showMessage("success", "Registration Successful");
            localStorage.setItem("userInfo", JSON.stringify(data));
            setUser(data);
            setLoading(false);
            setLoadingText("Create account");
            history.push("/chats");
        } catch (error) {
            showMessage("error", error.response?.data?.message || "Error Occurred!");
            setLoading(false);
            setLoadingText("Create account");
        }
    };

    const postDetails = (pics) => {
        if (!pics) {
            showMessage("warning", "Please select an image!");
            return;
        }

        if (pics.type === "image/jpeg" || pics.type === "image/png") {
            setLoading(true);
            setLoadingText("Uploading image...");
            setPicName(pics.name);

            const data = new FormData();
            data.append("file", pics);
            data.append("upload_preset", "TalkSync");
            data.append("cloud_name", "do0itnacu");

            fetch("https://api.cloudinary.com/v1_1/do0itnacu/image/upload", {
                method: "post",
                body: data,
            })
                .then((res) => res.json())
                .then((data) => {
                    setPic(data.url.toString());
                    setLoading(false);
                    setLoadingText("Create account");
                })
                .catch(() => {
                    setLoading(false);
                    setLoadingText("Create account");
                    showMessage("error", "Image upload failed");
                });
        } else {
            showMessage("warning", "Please select a valid image (jpeg/png)");
        }
    };

    return (
        <div className="flex flex-col gap-5">
            {message && (
                <div
                    className={`text-sm px-4 py-2 rounded-lg text-center font-medium
            ${message.type === "error" ? "bg-red-100 text-red-700" : ""}
            ${message.type === "success" ? "bg-green-100 text-green-700" : ""}
            ${message.type === "warning" ? "bg-yellow-100 text-yellow-700" : ""}
          `}
                >
                    {message.text}
                </div>
            )}

            <div className="animate-fade-up delay-2">
                <Input
                    label="Full name"
                    type="text"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    leftIcon={<User size={15} />}
                    error={errors.name}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="animate-fade-up delay-2">
                <Input
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    leftIcon={<Mail size={15} />}
                    error={errors.email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="animate-fade-up delay-3">
                <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    leftIcon={<Lock size={15} />}
                    rightIcon={
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="text-saltwater hover:text-viridian transition-colors"
                        >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    }
                    error={errors.password}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <div className="animate-fade-up delay-3">
                <Input
                    label="Confirm password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    leftIcon={<Lock size={15} />}
                    rightIcon={
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="text-saltwater hover:text-viridian transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    }
                    error={errors.confirmPassword}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>

            {/* Profile picture upload */}
            <div className="animate-fade-up delay-4 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-viridian">
                    Profile picture (optional)
                </label>
                <label
                    className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl bg-white
            border border-dashed border-nordic shadow-card hover:border-cerulean
            transition-colors duration-200"
                >
                    {pic ? (
                        <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                    ) : (
                        <ImagePlus size={18} className="text-saltwater shrink-0" />
                    )}
                    <span className="text-sm text-gray-500 truncate">
                        {picName || "Click to upload a profile picture"}
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => postDetails(e.target.files[0])}
                    />
                </label>
            </div>

            <motion.div whileTap={{ scale: 0.98 }} className="animate-fade-up delay-5 mt-1">
                <Button
                    className="w-full"
                    size="lg"
                    isLoading={loading}
                    rightIcon={!loading && <ArrowRight size={16} />}
                    onClick={submitHandler}
                >
                    {loading ? loadingText : "Create account"}
                </Button>
            </motion.div>
        </div>
    );
};

export default SignUp;