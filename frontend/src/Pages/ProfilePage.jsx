import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit2,
  Loader2,
  Mail,
  User,
  KeyRound,
  Users,
  UserPlus,
} from "lucide-react";
import { ChatState } from "../context/ChatProvider";
import ChangePasswordModal from "../components/Profile/ChangePasswordModal";

// full-page version of what used to be the "own profile" branch of
// ProfileModal — avatar upload + password change live here now.
// ProfileModal.jsx is now only used for viewing OTHER users.
const ProfilePage = () => {
  const { user, setUser } = ChatState();
  const history = useHistory();

  const [pwdOpen, setPwdOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // connection stats — fetched here rather than stored globally,
  // since this page is the only place that needs them right now
  const [stats, setStats] = useState({ connections: 0, pending: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fileInputRef = useRef(null);

  const authConfig = {
    headers: { Authorization: `Bearer ${user.token}` },
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [connectionsRes, pendingRes] = await Promise.all([
          axios.get("/api/connection/my-connections", authConfig),
          axios.get("/api/connection/pending", authConfig),
        ]);

        setStats({
          connections: connectionsRes.data.length,
          pending: pendingRes.data.length,
        });
      } catch (error) {
        console.log("Failed to fetch connection stats", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        { method: "post", body: formData },
      );
      const cloudData = await res.json();

      const { data } = await axios.put(
        "/api/user/update-pic",
        { pic: cloudData.url },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        },
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

  return (
    <div className="min-h-screen bg-swan/40 flex flex-col">
      {/* Page header */}
      <div className="relative bg-white border-b border-nordic/40 shadow-card sticky top-0 z-10">
        {/* gradient accent strip, matches ChangePasswordModal's header treatment */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-peacock via-cerulean to-viridian" />

        <div className="px-4 sm:px-6 pt-5 pb-4 flex items-center gap-3">
          <button
            onClick={() => history.goBack()}
            className="p-2 rounded-lg hover:bg-swan text-saltwater
        hover:text-viridian transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          {/* brand mark, same as SideBar's navbar logo */}
          <div
            className="w-9 h-9 bg-viridian rounded-lg flex items-center
      justify-center shadow-3d shrink-0"
          >
            <User size={16} className="text-white" />
          </div>

          <div>
            <h1 className="font-display text-viridian text-xl leading-tight">
              My Profile
            </h1>
            <p className="text-xs text-saltwater">
              Manage your account details
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Toast message */}
          {message && (
            <div
              className={`mb-4 text-sm px-4 py-2 rounded-lg text-center font-medium
              ${message.type === "error" ? "bg-red-100 text-red-700" : ""}
              ${message.type === "success" ? "bg-green-100 text-green-700" : ""}
              ${message.type === "warning" ? "bg-yellow-100 text-yellow-700" : ""}
            `}
            >
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-card-lg border border-nordic/40 overflow-hidden">
            {/* Avatar section */}
            <div
              className="flex flex-col items-center gap-4 px-6 pt-8 pb-6
              bg-gradient-to-r from-peacock/10 to-cerulean/5"
            >
              <div className="relative">
                <div
                  className="w-28 h-28 rounded-full overflow-hidden border-4
                  border-nordic shadow-card-lg bg-swan flex items-center justify-center"
                >
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

                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => postDetails(e.target.files[0])}
                />
              </div>

              <div className="text-center">
                <p className="font-display text-viridian text-lg capitalize">
                  {user.name}
                </p>
                <p className="text-sm text-saltwater">{user.email}</p>
              </div>
            </div>

            {/* Connection stats — tap either to jump to Connections page */}
            <div className="grid grid-cols-2 divide-x divide-nordic/30 border-y border-nordic/30">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => history.push("/connections")}
                className="flex flex-col items-center gap-1 py-4 hover:bg-swan/60 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-peacock">
                  <Users size={16} />
                  <span className="text-lg font-bold text-viridian">
                    {statsLoading ? "—" : stats.connections}
                  </span>
                </div>
                <span className="text-xs text-saltwater">Connections</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => history.push("/connections?tab=requests")}
                className="flex flex-col items-center gap-1 py-4 hover:bg-swan/60 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-cerulean">
                  <UserPlus size={16} />
                  <span className="text-lg font-bold text-viridian">
                    {statsLoading ? "—" : stats.pending}
                  </span>
                </div>
                <span className="text-xs text-saltwater">Pending Requests</span>
              </motion.button>
            </div>

            {/* Info + actions */}
            <div className="px-6 py-6 flex flex-col gap-3">
              <div
                className="flex items-center gap-3 px-4 py-3 bg-swan
                rounded-xl border border-nordic/40"
              >
                <User size={16} className="text-peacock shrink-0" />
                <div>
                  <p className="text-xs text-saltwater">Full name</p>
                  <p className="text-sm font-semibold text-viridian capitalize">
                    {user.name}
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-3 px-4 py-3 bg-swan
                rounded-xl border border-nordic/40"
              >
                <Mail size={16} className="text-cerulean shrink-0" />
                <div>
                  <p className="text-xs text-saltwater">Email address</p>
                  <p className="text-sm font-semibold text-viridian">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPwdOpen(true)}
                className="flex items-center gap-2 justify-center mt-2 px-4 py-3 rounded-xl
                  text-sm font-semibold text-cerulean border border-cerulean/40
                  hover:bg-cerulean/5 transition-colors"
              >
                <KeyRound size={15} />
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal isOpen={pwdOpen} onClose={() => setPwdOpen(false)} />
    </div>
  );
};

export default ProfilePage;
