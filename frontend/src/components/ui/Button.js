import React from "react";
import { Loader2 } from "lucide-react";

const variants = {
    primary:
        "bg-gradient-to-r from-peacock to-cerulean text-white shadow-3d hover:shadow-3d-hover",
    ghost:
        "bg-white text-viridian border border-nordic shadow-card hover:bg-swan",
};

const sizes = {
    md: "py-2 px-4 text-sm",
    lg: "py-3 px-5 text-base",
};

const Button = ({
    children,
    variant = "primary",
    size = "md",
    isLoading = false,
    rightIcon,
    className = "",
    disabled,
    ...props
}) => {
    return (
        <button
            disabled={disabled || isLoading}
            className={`rounded-xl font-semibold transition-all duration-200
        flex items-center justify-center gap-2
        active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Please wait...
                </>
            ) : (
                <>
                    {children}
                    {rightIcon}
                </>
            )}
        </button>
    );
};

export default Button;