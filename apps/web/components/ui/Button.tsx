import React from "react";
import { cn } from "../../lib/cn";

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
  const variants: Record<string, string> = {
    primary: "bg-primary text-white hover:bg-primary-hover",
    secondary: "bg-surface-2 text-foreground hover:bg-[#24242c]",
    outline: "border border-[var(--border)] bg-transparent text-foreground hover:bg-white/[0.04]",
    ghost: "bg-transparent text-muted hover:text-foreground hover:bg-white/[0.04]",
    danger: "bg-danger text-white hover:opacity-90",
  };

  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-[13px] gap-1.5",
    md: "h-10 px-4 text-[14px] gap-2",
    lg: "h-11 px-5 text-[15px] gap-2",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[6px] font-semibold transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
