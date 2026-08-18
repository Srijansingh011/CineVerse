'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../lib/api';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Logo } from './layout/Logo';
import { cn } from '../lib/cn';
import { initials } from '../lib/format';

const navLinks = [
  { href: '/search', label: 'Movies' },
  { href: '/shows', label: 'Cinemas' },
  { href: '/community', label: 'Community' },
  { href: '/parties', label: 'Watch Party' },
  { href: '/planner', label: 'Planner' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [city, setCity] = useState<{ id: string; name: string } | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/theatres/cities');
        const list = res.data || [];
        setCities(list);
        const saved = typeof window !== 'undefined' ? localStorage.getItem('cv-city') : null;
        const parsed = saved ? JSON.parse(saved) : null;
        const match = list.find((c: any) => c.id === parsed?.id) || list[0];
        if (match) {
          setCity(match);
          localStorage.setItem('cv-city', JSON.stringify(match));
        }
      } catch {
        setCity({ id: '', name: 'Bengaluru' });
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 h-16 transition-colors duration-200",
        isScrolled
          ? "bg-[#0b0b0f]/88 backdrop-blur-md border-b border-[var(--border)]"
          : "bg-gradient-to-b from-black/70 to-transparent"
      )}
    >
      <div className="cv-container h-full">
        <div className="flex h-full items-center gap-6">
          <Logo />

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                    isActive ? "text-white" : "text-muted hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => router.push('/search')}
              className="md:hidden p-2 text-muted hover:text-white"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <div className="hidden md:block relative w-[220px] lg:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                readOnly
                placeholder="Search movies, actors, cinemas..."
                className="pl-9 h-9 bg-surface-2 border-[var(--border)] cursor-pointer text-[13px]"
                onFocus={() => router.push('/search')}
                onClick={() => router.push('/search')}
              />
            </div>

            <div ref={cityRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setCityOpen((v) => !v)}
                className="flex items-center gap-1.5 h-9 px-2.5 text-[13px] text-muted hover:text-white"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="max-w-[100px] truncate">{city?.name || 'City'}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {cityOpen && cities.length > 0 && (
                <div className="absolute right-0 mt-1 w-48 bg-surface border border-[var(--border)] rounded-[8px] py-1 shadow-xl z-50">
                  {cities.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 text-[13px] hover:bg-white/[0.04]",
                        city?.id === c.id ? "text-white" : "text-muted"
                      )}
                      onClick={() => {
                        setCity(c);
                        localStorage.setItem('cv-city', JSON.stringify(c));
                        setCityOpen(false);
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated && user ? (
              <>
                <NotificationBell />
                <div ref={profileRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    className="h-8 w-8 rounded-full bg-surface-2 border border-[var(--border)] text-[12px] font-semibold text-white"
                    aria-label="Profile"
                  >
                    {initials(user.name, user.email)}
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-[var(--border)] rounded-[8px] py-1 shadow-xl z-50">
                      <div className="px-3 py-2 border-b border-[var(--border)]">
                        <p className="text-[13px] font-medium text-white truncate">{user.name || 'Account'}</p>
                        <p className="text-[12px] text-muted truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" className="block px-3 py-2 text-[13px] text-muted hover:text-white" onClick={() => setProfileOpen(false)}>
                        Profile
                      </Link>
                      <Link href="/notifications" className="block px-3 py-2 text-[13px] text-muted hover:text-white" onClick={() => setProfileOpen(false)}>
                        Notifications
                      </Link>
                      {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                        <Link href="/admin" className="block px-3 py-2 text-[13px] text-muted hover:text-white" onClick={() => setProfileOpen(false)}>
                          Admin
                        </Link>
                      )}
                      {(user.role === 'THEATRE_OWNER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                        <Link href="/theatre-owner" className="block px-3 py-2 text-[13px] text-muted hover:text-white" onClick={() => setProfileOpen(false)}>
                          Theatre dashboard
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-[13px] text-danger hover:bg-white/[0.03]"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="hidden sm:inline text-[13px] text-muted hover:text-white">
                  Sign in
                </Link>
                <Button size="sm" onClick={() => router.push('/register')}>
                  Join
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
