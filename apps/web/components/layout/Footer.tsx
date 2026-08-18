"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <footer className="border-t border-[var(--border)] bg-[#09090c] mt-8">
      <div className="cv-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-3 text-[13px] leading-relaxed text-muted max-w-[220px]">
              Discover films, book cinema seats, and share what you watch.
            </p>
          </div>

          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white mb-3">Explore</h4>
            <ul className="space-y-2 text-[13px] text-muted">
              <li><Link href="/search" className="hover:text-white">Movies</Link></li>
              <li><Link href="/shows" className="hover:text-white">Cinemas</Link></li>
              <li><Link href="/community" className="hover:text-white">Community</Link></li>
              <li><Link href="/parties" className="hover:text-white">Watch Party</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white mb-3">Company</h4>
            <ul className="space-y-2 text-[13px] text-muted">
              <li><Link href="/assistant" className="hover:text-white">AI companion</Link></li>
              <li><Link href="/planner" className="hover:text-white">Movie night</Link></li>
              <li><Link href="/theatre-owner" className="hover:text-white">For theatres</Link></li>
              <li><Link href="/profile" className="hover:text-white">Help</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white mb-3">Legal</h4>
            <ul className="space-y-2 text-[13px] text-muted">
              <li><Link href="#" className="hover:text-white">Privacy</Link></li>
              <li><Link href="#" className="hover:text-white">Terms</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white mb-3">Newsletter</h4>
            {done ? (
              <p className="text-[13px] text-muted">Thanks — we’ll keep it cinematic.</p>
            ) : (
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setDone(true);
                }}
              >
                <Input
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-[13px]"
                />
                <Button type="submit" size="sm">Subscribe</Button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12px] text-muted">
          <p>© {new Date().getFullYear()} CineVerse</p>
          <p>Movies · Booking · Community</p>
        </div>
      </div>
    </footer>
  );
}
