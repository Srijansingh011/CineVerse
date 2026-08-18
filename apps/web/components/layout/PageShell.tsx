"use client";

import Navbar from "../Navbar";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { cn } from "../../lib/cn";

export function PageShell({
  children,
  footer = true,
  className,
}: {
  children: React.ReactNode;
  footer?: boolean;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div
        className={cn(
          "flex-1 pt-16 pb-20 md:pb-0",
          className
        )}
      >
        {children}
      </div>
      {footer ? <Footer /> : null}
      <MobileNav />
    </div>
  );
}
