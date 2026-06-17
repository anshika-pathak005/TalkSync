import React, { useEffect, useRef } from "react";
import {
    isSameSender,
    isLastMessage,
    isSameSenderMargin,
    isSameUser,
} from "../../config/ChatsLogic";
import { ChatState } from "../../context/ChatProvider";

const ChatMessages = ({ messages }) => {
    const messagesEndRef = useRef(null);
    const { user } = ChatState();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col overflow-y-auto h-full p-3 gap-0.5">
            {messages &&
                messages.map((m, i) => {
                    const isOwn = m.sender._id === user._id;
                    const showAvatar =
                        isSameSender(messages, m, i, user._id) ||
                        isLastMessage(messages, i, user._id);

                    return (
                        <div className="flex items-end" key={m._id}>
                            {showAvatar ? (
                                <div
                                    title={m.sender.name}
                                    className="w-7 h-7 rounded-full overflow-hidden mr-2 shrink-0 bg-nordic flex items-center justify-center"
                                    style={{
                                        marginLeft: isSameSenderMargin(messages, m, i, user._id),
                                    }}
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
                                </div>
                            ) : (
                                <div
                                    className="w-7 mr-2 shrink-0"
                                    style={{
                                        marginLeft: isSameSenderMargin(messages, m, i, user._id),
                                    }}
                                />
                            )}

                            <span
                                className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm shadow-sm
                  ${isOwn
                                        ? "bg-gradient-to-r from-peacock to-cerulean text-white"
                                        : "bg-white text-viridian border border-nordic/50"
                                    }`}
                                style={{
                                    marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                                }}
                            >
                                {m.content}
                            </span>
                        </div>
                    );
                })}

            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessages;