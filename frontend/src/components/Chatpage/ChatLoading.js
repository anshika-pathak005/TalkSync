import React from "react";

const ChatLoading = () => {
    return (
        <div className="flex flex-col gap-2.5 w-full">
            {Array.from({ length: 10 }).map((_, i) => (
                <div
                    key={i}
                    className="h-12 w-full rounded-xl bg-nordic/40 animate-pulse"
                />
            ))}
        </div>
    );
};

export default ChatLoading;