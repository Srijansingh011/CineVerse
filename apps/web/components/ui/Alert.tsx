import React from "react";
import { cn } from "../../lib/cn";

export function Alert({
  variant = "error",
  title,
  children,
  action,
  className,
}: {
  variant?: "error" | "success" | "info";
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const styles = {
    error: "border-danger/30 bg-danger/8 text-danger",
    success: "border-success/30 bg-success/8 text-success",
    info: "border-accent/30 bg-accent/8 text-accent",
  };

  return (
    <div className={cn("rounded-[8px] border px-4 py-3 text-[14px]", styles[variant], className)}>
      {title ? <p className="font-semibold mb-0.5">{title}</p> : null}
      <div className="text-foreground/80">{children}</div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
