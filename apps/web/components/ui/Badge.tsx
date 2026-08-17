import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "highlight" | "danger" | "success";
}

export function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2";
  
  const variants = {
    default: "bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-transparent",
    outline: "text-slate-100 border border-slate-700",
    highlight: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    danger: "bg-red-500/20 text-red-400 border border-red-500/30",
    success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
