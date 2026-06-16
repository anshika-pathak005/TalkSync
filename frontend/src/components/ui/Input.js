import React, { forwardRef } from "react";

const Input = forwardRef(
    ({ label, leftIcon, rightIcon, error, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label className="text-sm font-medium text-viridian">{label}</label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-saltwater">
                            {leftIcon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        className={`w-full ${leftIcon ? "pl-10" : "pl-4"} ${rightIcon ? "pr-10" : "pr-4"
                            } py-2.5 rounded-xl bg-white border text-sm
              placeholder:text-gray-400 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-cerulean
              ${error ? "border-red-400" : "border-nordic"}
              shadow-card`}
                        {...props}
                    />
                    {rightIcon && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            {rightIcon}
                        </span>
                    )}
                </div>
                {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
            </div>
        );
    }
);

export default Input;