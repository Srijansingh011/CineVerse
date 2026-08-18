import React from "react";
import { cn } from "../../lib/cn";

export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[6px] bg-surface-2 animate-shimmer", className)} {...props} />;
}

export function MovieSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="aspect-[2/3] w-full rounded-[8px]" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
