import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import axios from "axios";
import {
    isSameSender,
    isLastMessage,
    isSameSenderMargin,
    isSameUser,
} from "../../config/ChatsLogic";
import { ChatState } from "../../context/ChatProvider";
import ProfileModal from "../others/profileModal";

const ChatMessages = ({ messages, isTyping, systemNotice, socket, onMessageDeletedForMe, onMessageDeletedForEveryone }) => {
    // anchor div right after the last message — scrollIntoView on
    // this always lands exactly at the bottom of the chat
    const messagesEndRef = useRef(null);

    // the scrollable messages pane — used to measure how much space is
    // actually available above/below a bubble before opening its menu
    const containerRef = useRef(null);

    // remembers how many messages we had last render, so we can tell
    // "chat just opened" (0 -> many, should jump instantly) apart from
    // "one live message just arrived" (should scroll smoothly)
    const prevMessageCountRef = useRef(0);

    const { user } = ChatState();

    // controls the "view sender's profile" popup, opens when their
    // avatar is clicked
    const [profileUser, setProfileUser] = useState(null);

    // inside the component, new state
    const [openMenuId, setOpenMenuId] = useState(null);
    // which way the open menu should render — recomputed fresh every
    // time a menu opens, based on real available space (see openMenuFor)
    const [menuDirection, setMenuDirection] = useState("down");
    const [deletingId, setDeletingId] = useState(null);

    // useLayoutEffect runs BEFORE the browser paints — so scrolling
    // happens before you ever see the wrong position. A normal
    // useEffect would paint at the top first, then scroll, which is
    // the "jumps after showing top messages" flash you saw earlier.
    useLayoutEffect(() => {
        const isFreshChatLoad = prevMessageCountRef.current === 0 && messages.length > 0;

        messagesEndRef.current?.scrollIntoView({
            behavior: isFreshChatLoad ? "instant" : "smooth",
        });

        prevMessageCountRef.current = messages.length;

        // Added isTyping to dependencies — so when typing indicator
        // appears/disappears, scroll adjusts accordingly, ensuring it's
        // always visible and doesn't get hidden below the last message
    }, [messages, isTyping]);

    // closes an open delete-menu when you click/tap anywhere else on
    // the page — the bubble's own handler calls stopPropagation, so
    // this only ever fires for clicks OUTSIDE the open menu
    useEffect(() => {
        if (!openMenuId) return;
        const closeMenu = () => setOpenMenuId(null);
        document.addEventListener("click", closeMenu);
        return () => document.removeEventListener("click", closeMenu);
    }, [openMenuId]);

    // approx rendered height of the dropdown (1 button for messages that
    // aren't mine, 2 for ones that are) — used to decide which way it fits
    const MENU_HEIGHT_ONE_ROW = 44;
    const MENU_HEIGHT_TWO_ROW = 80;

    // opens (or closes, if already open) the delete-menu for message `m`,
    // measuring real space above/below the bubble inside the scrollable
    // pane first so the menu opens whichever direction actually has room —
    // instead of guessing from the message's position in the list
    const openMenuFor = (m, e) => {
        if (m.isDeletedForEveryone) return;

        if (openMenuId === m._id) {
            setOpenMenuId(null);
            return;
        }

        const containerRect = containerRef.current?.getBoundingClientRect();
        const bubbleRect = e.currentTarget.getBoundingClientRect();
        const menuHeight =
            m.sender._id === user._id ? MENU_HEIGHT_TWO_ROW : MENU_HEIGHT_ONE_ROW;

        if (containerRect) {
            const spaceBelow = containerRect.bottom - bubbleRect.bottom;
            const spaceAbove = bubbleRect.top - containerRect.top;
            // only flip upward if there's genuinely not enough room below
            // AND there's more room above than below
            setMenuDirection(
                spaceBelow < menuHeight && spaceAbove > spaceBelow ? "up" : "down"
            );
        }

        setOpenMenuId(m._id);
    };

    const authConfig = {
        headers: { Authorization: `Bearer ${user.token}` },
    };

    const handleDeleteForMe = async (messageId) => {
        try {
            setDeletingId(messageId);
            await axios.put(`/api/message/${messageId}/delete-for-me`, {}, authConfig);
            // remove it from local state immediately — only I should stop seeing it
            onMessageDeletedForMe(messageId); // callback prop, see below
        } catch (error) {
            console.log("Failed to delete for me", error);
        } finally {
            setDeletingId(null);
            setOpenMenuId(null);
        }
    };

    const handleDeleteForEveryone = async (messageId) => {
        try {
            setDeletingId(messageId);
            const { data } = await axios.put(
                `/api/message/${messageId}/delete-for-everyone`,
                {},
                authConfig
            );
            // broadcast to the other participant(s) live
            socket.emit("message deleted", data.updatedMessage); // needs socket prop passed down
            onMessageDeletedForEveryone(data.updatedMessage); // callback prop, updates local state
        } catch (error) {
            console.log("Failed to delete for everyone", error);
        } finally {
            setDeletingId(null);
            setOpenMenuId(null);
        }
    };

    return (
        <div ref={containerRef} className="flex flex-col overflow-y-auto h-full p-3">
            {messages &&
                messages.map((m, i) => {

                    // system messages (leave/remove group) render as a centered
                    // badge, completely bypassing avatar/bubble alignment logic
                    if (m.messageType === "system") {
                        return (
                            <div key={m._id} className="flex justify-center my-1.5">
                                <span className="text-[11px] sm:text-xs text-saltwater/70 text-center max-w-[85%] px-2">
                                    {m.content}
                                </span>
                            </div>
                        );
                    }

                    // is this message mine, or the other person's?
                    const isOwn = m.sender._id === user._id;

                    // IMPORTANT FIX: avatar only ever shows for the OTHER
                    // person's messages — exactly like your original chakra
                    // version. My own messages never had an avatar column
                    // reserved for them at all; they just get pushed fully
                    // to the right via marginLeft: "auto" below. Reserving
                    // an avatar-width column for MY OWN messages too (which
                    // the previous rewrite accidentally did) is what threw
                    // off the alignment.
                    const showAvatar =
                        !isOwn &&
                        (isSameSender(messages, m, i, user._id) ||
                            isLastMessage(messages, i, user._id));

                    return (
                        <div className="flex" key={m._id}>
                            {/* avatar — only rendered for the other person,
                  and only on the LAST message of a consecutive run
                  from them (so it doesn't repeat next to every
                  single line they send in a row) */}
                            {showAvatar && (
                                <button
                                    type="button"
                                    onClick={() => setProfileUser(m.sender)}
                                    title={m.sender.name}
                                    className="mt-[7px] mr-1 w-8 h-8 rounded-full overflow-hidden
                    shrink-0 bg-nordic flex items-center justify-center
                    hover:ring-2 hover:ring-cerulean/50 transition-all"
                                >
                                    {m.sender.pic ? (
                                        <img
                                            src={m.sender.pic}
                                            alt={m.sender.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xs font-semibold text-viridian">
                                            {m.sender.name?.charAt(0)?.toUpperCase()}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* the message bubble itself — SAME element as before
                  (still the direct flex-item span carrying marginLeft/
                  maxWidth), just with position:relative + the two menu
                  triggers added. We deliberately do NOT wrap this span in
                  an extra <div> — a wrapping div would become the actual
                  flex item instead, leaving this span's `maxWidth: 75%`
                  to resolve against an auto-sized parent (a circular
                  percentage reference), which CSS resolves by dropping
                  the cap entirely. That's what stretched bubbles full
                  width last time. Keeping this span as the flex item
                  avoids that.
                  marginLeft comes straight from isSameSenderMargin:
                  - "auto"  -> my own messages, pushes bubble to the far right
                  -  33px   -> other person's consecutive message with NO
                              avatar shown this line (keeps it lined up
                              under where their avatar would be)
                  -  0      -> other person's message that DOES have an
                              avatar right next to it this line */}
                            <span
                                onContextMenu={(e) => {
                                    // desktop: right-click opens the menu instead
                                    // of the native browser context menu
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openMenuFor(m, e);
                                }}
                                onClick={(e) => {
                                    // touch screens: a tap fires as a click with no
                                    // right-click equivalent, so this opens the same menu
                                    e.stopPropagation();
                                    openMenuFor(m, e);
                                }}
                                className={`text-sm shadow-sm relative select-none
                  ${m.isDeletedForEveryone ? "italic opacity-60" : "cursor-pointer"}
                  ${isOwn
                                        ? "bg-gradient-to-r from-peacock to-cerulean text-white"
                                        : "bg-white text-viridian border border-nordic/50"
                                    }`}
                                style={{
                                    marginLeft: isSameSenderMargin(messages, m, i, user._id),
                                    marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                                    borderRadius: "20px",
                                    padding: "5px 15px",
                                    maxWidth: "75%",
                                }}
                            >
                                {m.content}

                                {/* delete menu — opens on right-click (desktop) or tap
                    (touch). Anchored to THIS span via position:relative
                    above, so it always tracks the bubble regardless of
                    where it lands in the scroll list.
                    - horizontal: right-0 for my own messages (which hug
                      the right edge), left-0 for the other person's
                      (which hug the left edge) — either way the menu
                      opens toward the middle of the screen, never off
                      the edge, even on narrow phones.
                    - vertical: menuDirection is computed fresh on open
                      (see openMenuFor) from the bubble's actual position
                      inside the scrollable pane, so it opens upward near
                      the bottom, downward near the top (e.g. the very
                      first message), and never gets clipped either way. */}
                                {openMenuId === m._id && (
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className={`absolute w-40 max-w-[70vw] bg-white rounded-xl
                        shadow-card-lg border border-nordic/40 z-20 py-1 text-left normal-case
                        ${isOwn ? "right-0" : "left-0"}
                        ${menuDirection === "up" ? "bottom-full mb-1" : "top-full mt-1"}`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteForMe(m._id)}
                                            disabled={deletingId === m._id}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs
                          text-viridian hover:bg-swan transition-colors disabled:opacity-60"
                                        >
                                            <Trash2 size={12} /> Delete for Me
                                        </button>

                                        {isOwn && !m.isDeletedForEveryone && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteForEveryone(m._id)}
                                                disabled={deletingId === m._id}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs
                            text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                                            >
                                                <Trash2 size={12} /> Delete for Everyone
                                            </button>
                                        )}
                                    </div>
                                )}
                            </span>
                        </div>
                    );
                })}



            {/* NEW: typing indicator is now rendered here — like a normal
    message inside the scrollable list, right after the last message.
    This makes it part of the flow (container grows/scrolls naturally),
    and it doesn't overlap with the message above it */}
            {isTyping && (
                <div className="flex items-end" style={{ marginTop: 10 }}>
                    {/* avatar column ki jagah khali spacer, matching width/height */}
                    <div className="w-7 h-7 mr-2 shrink-0" />

                    <div className="flex items-center gap-1 px-4 py-2.5 rounded-2xl
            bg-white border border-nordic/50 shadow-sm">
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-saltwater animate-bounce"
                            style={{ animationDelay: "0ms" }}
                        />
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-saltwater animate-bounce"
                            style={{ animationDelay: "150ms" }}
                        />
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-saltwater animate-bounce"
                            style={{ animationDelay: "300ms" }}
                        />
                    </div>
                </div>
            )}

            {/* system notice — plain grey text, no bubble/border, minimal
    emphasis. Smaller on narrow screens via text-[11px] base,
    slightly larger from sm: breakpoint up */}
            {systemNotice && (
                <div className="flex justify-center my-1.5">
                    <span className="text-[11px] sm:text-xs text-saltwater/70 text-center max-w-[85%] px-2">
                        {systemNotice}
                    </span>
                </div>
            )}

            {/* invisible bottom anchor for auto-scroll */}
            <div ref={messagesEndRef} />

            {/* profile popup for whichever sender's avatar was clicked */}
            {profileUser && (
                <ProfileModal
                    user={profileUser}
                    isOpen={!!profileUser}
                    onClose={() => setProfileUser(null)}
                />
            )}
        </div>
    );
};

export default ChatMessages;