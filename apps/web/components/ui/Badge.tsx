import React from "react";
import { cn } from "../../lib/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "highlight" | "danger" | "success";
}

export function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-primary/15 text-primary",
    secondary: "bg-surface-2 text-muted",
    outline: "border border-[var(--border)] text-muted",
    highlight: "bg-[#d4a017]/15 text-highlight",
    danger: "bg-danger/15 text-danger",
    success: "bg-success/15 text-success",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[4px] px-2 py-0.5 text-[12px] font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
