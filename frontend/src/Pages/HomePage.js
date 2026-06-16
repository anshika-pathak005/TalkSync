import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Zap, Users, ShieldCheck } from "lucide-react";
import Login from "../components/Authentication/login";
import SignUp from "../components/Authentication/singUp";
import Card from "../components/ui/Card";
import chatIllustration from "../assets/chat-illustration.png";

const HomePage = () => {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      history.push("/chats");
    }
  }, [history]);

  return (
    <main className="min-h-screen w-full bg-swan flex items-center justify-center px-4 py-8 lg:py-12 relative overflow-hidden">
      {/* Background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cerulean/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-capri/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl relative flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
        {/* Left side — heading + illustration */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left"
        >
          <h1 className="font-display text-viridian text-2xl sm:text-3xl lg:text-4xl leading-tight mb-2">
            Conversations that{" "}
            <span className="text-peacock">just sync.</span>
          </h1>
          <p className="text-saltwater text-sm max-w-sm mb-6">
            Real-time messaging, group chats, and seamless connections —
            all in one place. Stay in sync with the people who matter most.
          </p>

          <img
            src={chatIllustration}
            alt="Chat illustration"
            className="w-3/4 max-w-xs lg:max-w-sm drop-shadow-2xl animate-fade-up delay-2"
          />

          {/* Feature highlights */}
          <div className="hidden lg:flex flex-wrap gap-3 mt-8">
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl shadow-card text-xs font-medium text-viridian">
              <Zap size={14} className="text-peacock" />
              Real-time chat
            </div>
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl shadow-card text-xs font-medium text-viridian">
              <Users size={14} className="text-cerulean" />
              Group conversations
            </div>
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl shadow-card text-xs font-medium text-viridian">
              <ShieldCheck size={14} className="text-peacock" />
              Secure & private
            </div>
          </div>
        </motion.div>

        {/* Right side — brand + auth card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center justify-center lg:justify-start gap-2.5 mb-5">
            <div className="w-10 h-10 bg-viridian rounded-xl flex items-center justify-center shadow-3d">
              <MessageCircle size={20} className="text-white" />
            </div>
            <span className="font-display text-viridian text-3xl">
              TalkSync
            </span>
          </div>

          <Card className="animate-fade-up delay-1">
            {/* Tabs */}
            <div className="flex bg-swan rounded-xl p-1 mb-7 relative">
              <button
                onClick={() => setActiveTab("login")}
                className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors duration-200
                  ${activeTab === "login" ? "text-white" : "text-viridian"}`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab("signup")}
                className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-lg transition-colors duration-200
                  ${activeTab === "signup" ? "text-white" : "text-viridian"}`}
              >
                Register
              </button>
              <motion.div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-peacock to-cerulean shadow-3d"
                initial={false}
                animate={{ left: activeTab === "login" ? "4px" : "calc(50%)" }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
              />
            </div>

            {/* Header text */}
            <div className="mb-6">
              <h2 className="font-display text-viridian text-2xl mb-1">
                {activeTab === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-sm text-saltwater">
                {activeTab === "login"
                  ? "Sign in to continue chatting with your circle."
                  : "Join TalkSync and start syncing conversations instantly."}
              </p>
            </div>

            {/* Form content */}
            {activeTab === "login" ? <Login /> : <SignUp />}
          </Card>

          <p className="text-center text-xs text-saltwater mt-6">
            By continuing, you agree to TalkSync's Terms & Privacy Policy.
          </p>
        </motion.div>
      </div>
    </main>
  );
};

export default HomePage;