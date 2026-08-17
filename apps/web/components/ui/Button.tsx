import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-[#05050A] cursor-pointer select-none";

  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] focus:ring-indigo-500",
    secondary:
      "bg-[#12121F] text-white border border-[#1A1A2E] hover:bg-[#1A1A2E] hover:border-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/5 focus:ring-slate-500",
    outline:
      "border border-[#2A2A3E] bg-transparent text-slate-200 hover:bg-white/[0.04] hover:border-indigo-500/40 hover:text-white focus:ring-indigo-500",
    ghost:
      "bg-white/[0.03] backdrop-blur-md text-slate-300 hover:bg-white/[0.08] hover:text-white border border-transparent hover:border-white/10 focus:ring-slate-500",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] focus:ring-red-500",
  };

  const sizes: Record<string, string> = {
    sm: "h-9 px-4 text-sm gap-1.5",
    md: "h-10 px-5 py-2 text-sm gap-2",
    lg: "h-12 px-8 text-base gap-2",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
