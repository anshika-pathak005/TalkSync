import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, User } from "lucide-react";

// NOTE: this modal is now ONLY used for viewing OTHER users' basic
// info (e.g. tapping a name inside an active chat later). Your own
// profile — avatar editing, password change, connection stats — now
// lives at Pages/ProfilePage.jsx as a full page.
// Connection actions (message/remove) for the viewed user will be
// wired in when this gets hooked up inside the chat view.
const ProfileModal = ({
  user,
  children,
  isOpen: controlledOpen,
  onClose: controlledClose,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpen = () => setInternalOpen(true);
  const onClose = controlledClose || (() => setInternalOpen(false));

  return (
    <>
      {children && (
        <span onClick={onOpen} className="cursor-pointer">
          {children}
        </span>
      )}

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="w-full max-w-sm bg-white rounded-2xl shadow-card-lg
                border border-nordic/40 overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between px-6 py-4
                  border-b border-nordic/30 bg-gradient-to-r from-peacock/10 to-cerulean/5"
                  >
                    <h2 className="font-display text-viridian text-xl">
                      {user.name}'s Profile
                    </h2>
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg hover:bg-swan text-saltwater
                      hover:text-viridian transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="px-6 py-6 flex flex-col items-center gap-5">
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

                    <div className="w-full flex flex-col gap-3">
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
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-end px-6 py-4
                  border-t border-nordic/30 bg-swan/50"
                  >
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white
                      bg-gradient-to-r from-peacock to-cerulean
                      shadow-3d hover:shadow-3d-hover transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ProfileModal;
