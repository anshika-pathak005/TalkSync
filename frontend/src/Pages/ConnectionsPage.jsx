import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Send,
  Check,
  X as XIcon,
  UserMinus,
  MessageCircle,
  Loader2,
  Mail,
} from "lucide-react";
import { ChatState } from "../context/ChatProvider";

const TABS = [
  { key: "connections", label: "Connections", icon: Users },
  { key: "requests", label: "Requests", icon: UserPlus },
  { key: "sent", label: "Sent", icon: Send },
];

// small helper — reads ?tab=requests from the URL so ProfilePage's
// stat buttons can deep-link straight into a specific tab
const getInitialTab = () => {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  return TABS.some((t) => t.key === tab) ? tab : "connections";
};

const ConnectionsPage = () => {
  const { user, setChats, chats, setSelectedChat } = ChatState();
  const history = useHistory();

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [connections, setConnections] = useState([]);
  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const authConfig = {
    headers: { Authorization: `Bearer ${user.token}` },
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [connRes, pendingRes, sentRes] = await Promise.all([
        axios.get("/api/connection/my-connections", authConfig),
        axios.get("/api/connection/pending", authConfig),
        axios.get("/api/connection/sent", authConfig),
      ]);

      setConnections(connRes.data);
      setPending(pendingRes.data);
      setSent(sentRes.data);
    } catch (error) {
      console.log("Failed to load connections data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // opens/creates chat with an accepted connection, then jumps
  // straight to the main chat screen
  const messageUser = async (userId) => {
    try {
      setActionLoadingId(userId);
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post("/api/chat", { userId }, config);
      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      history.push("/chats");
    } catch (error) {
      console.log("Failed to open chat", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const acceptRequest = async (connectionId) => {
    try {
      setActionLoadingId(connectionId);
      await axios.put("/api/connection/accept", { connectionId }, authConfig);
      await fetchAll();
    } catch (error) {
      console.log("Failed to accept request", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectRequest = async (connectionId) => {
    try {
      setActionLoadingId(connectionId);
      await axios.put("/api/connection/reject", { connectionId }, authConfig);
      setPending((prev) => prev.filter((r) => r._id !== connectionId));
    } catch (error) {
      console.log("Failed to reject request", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const cancelSentRequest = async (connectionId) => {
    try {
      setActionLoadingId(connectionId);
      await axios.put("/api/connection/cancel", { connectionId }, authConfig);
      setSent((prev) => prev.filter((r) => r._id !== connectionId));
    } catch (error) {
      console.log("Failed to cancel request", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const removeConnection = async (connectionId) => {
    try {
      setActionLoadingId(connectionId);
      await axios.put("/api/connection/remove", { connectionId }, authConfig);
      setConnections((prev) =>
        prev.filter((c) => c.connectionId !== connectionId),
      );
    } catch (error) {
      console.log("Failed to remove connection", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderAvatar = (person) => (
    <div
      className="w-11 h-11 rounded-full overflow-hidden border-2 border-nordic/40
      flex items-center justify-center shrink-0 bg-gradient-to-br from-peacock/20 to-cerulean/20"
    >
      {person.pic ? (
        <img
          src={person.pic}
          alt={person.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-lg font-display text-viridian font-semibold">
          {person.name?.charAt(0)?.toUpperCase()}
        </span>
      )}
    </div>
  );

  const renderEmptyState = (label) => (
    <div className="flex flex-col items-center justify-center h-40 text-saltwater gap-2 text-sm">
      <Users size={28} className="text-nordic" />
      {label}
    </div>
  );

  return (
    <div className="min-h-screen bg-swan/40 flex flex-col">
      {/* Page header */}
      <div className=" bg-white border-b border-nordic/40 shadow-card sticky top-0 z-10">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-peacock via-cerulean to-viridian" />

        <div className="px-4 sm:px-6 pt-5 pb-4 flex items-center gap-3">
          <button
            onClick={() => history.goBack()}
            className="p-2 rounded-lg hover:bg-swan text-saltwater
        hover:text-viridian transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div
            className="w-9 h-9 bg-viridian rounded-lg flex items-center
      justify-center shadow-3d shrink-0"
          >
            <Users size={16} className="text-white" />
          </div>

          <div>
            <h1 className="font-display text-viridian text-xl leading-tight">
              Connections
            </h1>
            <p className="text-xs text-saltwater">
              People you're connected with
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-center px-4 py-6">
        <div className="w-full max-w-md flex flex-col">
          {/* Tabs */}
          <div className="flex bg-white rounded-xl border border-nordic/40 shadow-card p-1 mb-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const count =
                tab.key === "requests"
                  ? pending.length
                  : tab.key === "sent"
                    ? sent.length
                    : null;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                    text-sm font-semibold transition-all
                    ${
                      isActive
                        ? "bg-gradient-to-r from-peacock to-cerulean text-white shadow-3d"
                        : "text-saltwater hover:bg-swan"
                    }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-bold rounded-full px-1.5
                      ${isActive ? "bg-white/25" : "bg-peacock text-white"}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-cerulean" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-2"
              >
                {/* ── Connections tab ─────────────────────────── */}
                {activeTab === "connections" &&
                  (connections.length === 0
                    ? renderEmptyState("No connections yet")
                    : connections.map((conn) => (
                        <div
                          key={conn.connectionId}
                          className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl
                          border border-nordic/40 shadow-sm"
                        >
                          {renderAvatar(conn.user)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-viridian truncate">
                              {conn.user.name}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <Mail
                                size={11}
                                className="text-saltwater shrink-0"
                              />
                              <p className="text-xs text-saltwater truncate">
                                {conn.user.email}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => messageUser(conn.user._id)}
                            disabled={actionLoadingId === conn.user._id}
                            className="p-2 rounded-lg bg-gradient-to-r from-peacock to-cerulean
                            text-white shadow-3d hover:shadow-3d-hover transition-all disabled:opacity-60"
                          >
                            {actionLoadingId === conn.user._id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <MessageCircle size={15} />
                            )}
                          </button>

                          <button
                            onClick={() => removeConnection(conn.connectionId)}
                            disabled={actionLoadingId === conn.connectionId}
                            className="p-2 rounded-lg bg-red-50 text-red-500
                            hover:bg-red-100 transition-all disabled:opacity-60"
                            title="Remove connection"
                          >
                            {actionLoadingId === conn.connectionId ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <UserMinus size={15} />
                            )}
                          </button>
                        </div>
                      )))}

                {/* ── Requests (incoming) tab ─────────────────── */}
                {activeTab === "requests" &&
                  (pending.length === 0
                    ? renderEmptyState("No pending requests")
                    : pending.map((req) => (
                        <div
                          key={req._id}
                          className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl
                          border border-nordic/40 shadow-sm"
                        >
                          {renderAvatar(req.sender)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-viridian truncate">
                              {req.sender.name}
                            </p>
                            <p className="text-xs text-saltwater truncate">
                              {req.sender.email}
                            </p>
                          </div>

                          <button
                            onClick={() => acceptRequest(req._id)}
                            disabled={actionLoadingId === req._id}
                            className="p-2 rounded-lg bg-green-50 text-green-600
                            hover:bg-green-100 transition-all disabled:opacity-60"
                          >
                            {actionLoadingId === req._id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Check size={15} />
                            )}
                          </button>

                          <button
                            onClick={() => rejectRequest(req._id)}
                            disabled={actionLoadingId === req._id}
                            className="p-2 rounded-lg bg-red-50 text-red-500
                            hover:bg-red-100 transition-all disabled:opacity-60"
                          >
                            <XIcon size={15} />
                          </button>
                        </div>
                      )))}

                {/* ── Sent tab ─────────────────────────────────── */}
                {activeTab === "sent" &&
                  (sent.length === 0
                    ? renderEmptyState("No sent requests")
                    : sent.map((req) => (
                        <div
                          key={req._id}
                          className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl
                          border border-nordic/40 shadow-sm"
                        >
                          {renderAvatar(req.receiver)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-viridian truncate">
                              {req.receiver.name}
                            </p>
                            <p className="text-xs text-saltwater truncate">
                              {req.receiver.email}
                            </p>
                          </div>

                          <button
                            onClick={() => cancelSentRequest(req._id)}
                            disabled={actionLoadingId === req._id}
                            className="px-3 py-1.5 rounded-lg bg-swan text-saltwater text-xs
                            font-semibold border border-nordic/40 hover:bg-nordic/20
                            transition-all disabled:opacity-60"
                          >
                            {actionLoadingId === req._id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              "Cancel"
                            )}
                          </button>
                        </div>
                      )))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage;
