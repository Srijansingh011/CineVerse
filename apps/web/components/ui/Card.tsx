import React from "react";
import { cn } from "../../lib/cn";

export function Card({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-surface border border-[var(--border)] rounded-[8px] overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 pt-5 pb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-[16px] font-semibold tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 pb-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 pb-5 flex items-center", className)} {...props}>
      {children}
    </div>
  );
}
