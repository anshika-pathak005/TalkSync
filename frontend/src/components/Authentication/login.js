import React, { useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { ChatState } from "../../context/ChatProvider";

const Login = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const history = useHistory();
  const { setUser } = ChatState();

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const validate = () => {
    const errs = {};
    if (!email) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitHandler = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const config = { headers: { "Content-type": "application/json" } };
      const { data } = await axios.post(
        "/api/user/login",
        { email, password },
        config
      );

      showMessage("success", "Login Successful");
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      setLoading(false);
      history.push("/chats");
    } catch (error) {
      showMessage("error", error.response?.data?.message || "Error Occurred!");
      setLoading(false);
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
          type={show ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
          leftIcon={<Lock size={15} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="text-saltwater hover:text-viridian transition-colors"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          error={errors.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="mt-1.5 flex justify-end">
          <button
            type="button"
            className="text-xs text-cerulean hover:text-viridian font-semibold transition-colors"
          >
            Forgot password?
          </button>
        </div>
      </div>

      <motion.div whileTap={{ scale: 0.98 }} className="animate-fade-up delay-4 mt-1">
        <Button
          className="w-full"
          size="lg"
          isLoading={loading}
          rightIcon={<ArrowRight size={16} />}
          onClick={submitHandler}
        >
          Sign In
        </Button>
      </motion.div>
    </div>
  );
};

export default Login;