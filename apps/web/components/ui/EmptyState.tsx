import React from "react";
import { cn } from "../../lib/cn";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-4", className)}>
      {icon ? <div className="mb-3 text-muted">{icon}</div> : null}
      <h3 className="text-[18px] font-semibold text-foreground">{title}</h3>
      {description ? <p className="mt-1.5 text-[14px] text-muted max-w-sm">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
