"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clapperboard, Ticket, Users, User } from "lucide-react";
import { cn } from "../../lib/cn";

const items = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/search", label: "Movies", icon: Clapperboard, match: (p: string) => p.startsWith("/search") || p.startsWith("/movies") },
  { href: "/shows", label: "Tickets", icon: Ticket, match: (p: string) => p.startsWith("/shows") || p.startsWith("/checkout") },
  { href: "/community", label: "Social", icon: Users, match: (p: string) => p.startsWith("/community") || p.startsWith("/parties") },
  { href: "/profile", label: "Profile", icon: User, match: (p: string) => p.startsWith("/profile") },
];

export function MobileNav() {
  const pathname = usePathname() || "/";

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border)] bg-[#0b0b0f]/92 backdrop-blur-md">
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium",
                active ? "text-white" : "text-muted"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
