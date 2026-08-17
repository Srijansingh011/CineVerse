import React from "react";

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-md bg-[#1A1A2E] animate-shimmer ${className}`}
      {...props}
    />
  );
}
