import React, { useLayoutEffect, useRef, useState } from "react";
import {
    isSameSender,
    isLastMessage,
    isSameSenderMargin,
    isSameUser,
} from "../../config/ChatsLogic";
import { ChatState } from "../../context/ChatProvider";
import ProfileModal from "../others/profileModal";

const ChatMessages = ({ messages, isTyping, systemNotice }) => {
    // anchor div right after the last message — scrollIntoView on
    // this always lands exactly at the bottom of the chat
    const messagesEndRef = useRef(null);

    // remembers how many messages we had last render, so we can tell
    // "chat just opened" (0 -> many, should jump instantly) apart from
    // "one live message just arrived" (should scroll smoothly)
    const prevMessageCountRef = useRef(0);

    const { user } = ChatState();

    // controls the "view sender's profile" popup, opens when their
    // avatar is clicked
    const [profileUser, setProfileUser] = useState(null);

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

    return (
        <div className="flex flex-col overflow-y-auto h-full p-3">
            {messages &&
                messages.map((m, i) => {

                    // system messages (leave/remove group) render as a centered
                    // badge, completely bypassing avatar/bubble alignment logic
                    if (m.messageType === "system") {
                        return (
                            <div key={m._id} className="flex justify-center my-2">
                                <span className="text-xs text-saltwater bg-swan px-3 py-1.5
                    rounded-full border border-nordic/40 text-center max-w-[85%]">
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

                            {/* the message bubble itself —
                  marginLeft comes straight from isSameSenderMargin:
                  - "auto"  -> my own messages, pushes bubble to the far right
                  -  33px   -> other person's consecutive message with NO
                              avatar shown this line (keeps it lined up
                              under where their avatar would be)
                  -  0      -> other person's message that DOES have an
                              avatar right next to it this line */}
                            <span
                                className={`text-sm shadow-sm
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

            {/* NEW: system notice — real messages ke map se poori tarah
          alag, isliye ChatsLogic ke index-based helpers isse kabhi
          touch hi nahi karte */}
            {systemNotice && (
                <div className="flex justify-center my-2">
                    <span className="text-xs text-saltwater bg-swan px-3 py-1.5
            rounded-full border border-nordic/40 text-center max-w-[85%]">
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