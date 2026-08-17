'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../lib/api';
import { Film, LogOut, Search, MapPin, Menu, X, Sparkles } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const navLinks = [
  { href: '/shows', label: 'Movies' },
  { href: '/parties', label: 'Watch Party' },
  { href: '/planner', label: 'Planner' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignored
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? 'glass-strong shadow-2xl shadow-black/30'
          : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent'
      }`}
    >
      {/* Accent glow line at top */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Location */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <Film className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" />
                <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-slate-100 transition-colors duration-300"
                    style={{ fontFamily: 'var(--font-display)' }}>
                CineVerse
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer px-2 py-1 rounded-full hover:bg-white/[0.06] transition-all duration-300 border border-transparent hover:border-white/10 text-xs">
              <MapPin className="h-3 w-3 text-indigo-400" />
              <span className="text-xs font-medium">Bengaluru</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-300" />
            <Input
              placeholder="Search movies, cinemas, users..."
              className="pl-9 bg-white/[0.04] border-white/[0.06] hover:border-white/10 focus:bg-white/[0.06] focus:border-indigo-500/40 transition-all duration-300 rounded-full h-8 text-xs backdrop-blur-md"
              onFocus={() => router.push('/search')}
            />
          </div>

          {/* Navigation & Profile */}
          <div className="hidden lg:flex items-center gap-5 shrink-0">
            <div className="flex items-center gap-0.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-white bg-white/[0.08]'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="h-4 w-px bg-white/[0.08]" />

            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <NotificationBell />

                  <Link href="/profile" className="group relative flex items-center gap-2">
                    <div className="relative">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-[#05050A] group-hover:ring-indigo-500/30 transition-all duration-300">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                    </div>
                  </Link>

                  {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                    <Button variant="outline" size="sm" onClick={() => router.push('/admin')}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Admin
                    </Button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-300"
                    title="Sign Out"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="text-xs font-medium text-slate-400 hover:text-white transition-colors duration-300 px-2 py-1"
                  >
                    Sign In
                  </Link>
                  <Button size="sm" onClick={() => router.push('/register')}>
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-3">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-300"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-14 w-full glass-strong shadow-2xl shadow-black/50 animate-scale-in origin-top">
          <div className="p-4 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search..."
                className="w-full pl-10 bg-white/[0.04] border-white/[0.06] rounded-xl"
                onFocus={() => { setMobileMenuOpen(false); router.push('/search'); }}
              />
            </div>

            <div className="flex flex-col gap-1 text-base font-medium">
              <Link href="/" className="p-3 rounded-xl hover:bg-white/[0.04] text-slate-300 hover:text-white transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'hover:bg-white/[0.04] text-slate-300 hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <Link href="/profile" className="p-3 rounded-xl hover:bg-white/[0.04] text-indigo-400 transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                  My Profile
                </Link>
              )}
            </div>

            <div className="h-px bg-white/[0.06] w-full my-1" />

            {isAuthenticated ? (
              <Button variant="danger" className="w-full" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                Sign Out
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full" onClick={() => { router.push('/login'); setMobileMenuOpen(false); }}>
                  Sign In
                </Button>
                <Button className="w-full" onClick={() => { router.push('/register'); setMobileMenuOpen(false); }}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
