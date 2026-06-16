import React from "react";

const Card = ({ children, className = "" }) => {
    return (
        <div
            className={`bg-white rounded-2xl p-8 shadow-card-lg border border-nordic/40 ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;