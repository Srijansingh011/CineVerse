'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../lib/api';
import Link from 'next/link';
import { Play, ChevronRight, Star, Users, Ticket, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { MovieCard } from '../components/movie/MovieCard';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const [trending, setTrending] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await apiFetch('/movies/trending');
        setTrending(response.data || []);
      } catch (err) {
        console.error('Failed to fetch trending movies:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isAuthenticated || !user) return;
      setLoadingRecs(true);
      try {
        const response = await apiFetch('/movies/recommendations');
        const mapped = (response.data || []).map((m: any) => ({
          ...m.movie,
          matchScore: m.score,
        }));
        setRecommendations(mapped);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecommendations();
  }, [isAuthenticated, user]);

  const heroMovie = trending[0];

  return (
    <div className="min-h-screen bg-[#05050A] text-slate-100 flex flex-col font-sans relative">
      <Navbar />

      {/* ═══════════════════════════════════════════════════
          CINEMATIC HERO
         ═══════════════════════════════════════════════════ */}
      <header className="relative w-full h-[80vh] min-h-[520px] flex items-end pb-20 md:pb-24 overflow-hidden">
        {heroMovie ? (
          <div className="absolute inset-0 z-0">
            {/* Multi-layer gradient overlay for cinematic depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-[#05050A]/70 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05050A]/90 via-[#05050A]/30 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-10" />
            
            {/* Backdrop image */}
            <img
              src={heroMovie.backdropPath
                ? (heroMovie.backdropPath.startsWith('http') ? heroMovie.backdropPath : `https://image.tmdb.org/t/p/original${heroMovie.backdropPath}`)
                : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop'}
              alt={heroMovie.title}
              className="w-full h-full object-cover object-center opacity-60 scale-105 animate-fade-in"
            />
          </div>
        ) : (
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-[#05050A] to-[#05050A]" />
          </div>
        )}

        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] animate-float-orb pointer-events-none z-[5]" />
        <div className="absolute bottom-1/3 right-1/4 w-52 h-52 bg-violet-600/8 rounded-full blur-[80px] animate-float-orb-reverse pointer-events-none z-[5]" />

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {heroMovie ? (
            <div className="max-w-2xl space-y-4">
              {/* Trending Badge */}
              <div className="animate-slide-up flex items-center gap-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 backdrop-blur-md animate-breathe">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Trending #1</span>
                </div>
                {heroMovie.rating && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 backdrop-blur-md">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-bold text-amber-300">{heroMovie.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1
                className="animate-slide-up delay-100 text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1] drop-shadow-2xl"
                style={{ fontFamily: 'var(--font-display)', opacity: 0, animationFillMode: 'forwards' }}
              >
                {heroMovie.title}
              </h1>

              {/* Meta info */}
              <div className="animate-slide-up delay-200 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                {heroMovie.releaseDate && (
                  <span className="bg-white/[0.06] px-2.5 py-0.5 rounded-full backdrop-blur-sm">{new Date(heroMovie.releaseDate).getFullYear()}</span>
                )}
                {heroMovie.duration && (
                  <span className="bg-white/[0.06] px-2.5 py-0.5 rounded-full backdrop-blur-sm">{Math.floor(heroMovie.duration / 60)}h {heroMovie.duration % 60}m</span>
                )}
                {heroMovie.genres && heroMovie.genres.map((genre: string) => (
                  <span key={genre} className="bg-white/[0.06] px-2.5 py-0.5 rounded-full backdrop-blur-sm">{genre}</span>
                ))}
              </div>

              {/* Description */}
              <p className="animate-slide-up delay-300 text-sm text-slate-400 line-clamp-2 max-w-lg leading-relaxed" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                {heroMovie.description || "Experience the most anticipated cinematic event of the year. Book your tickets now to secure the best seats."}
              </p>

              {/* Action Buttons */}
              <div className="animate-slide-up delay-400 flex flex-wrap items-center gap-3 pt-3" style={{ opacity: 0, animationFillMode: 'forwards' }}>
                <Link href={`/shows?movie=${heroMovie.id}`}>
                  <Button size="md" className="h-10 px-6 text-sm font-bold animate-glow-pulse">
                    <Ticket className="w-4 h-4" />
                    Book Tickets
                  </Button>
                </Link>
                <Link href={`/movies/${heroMovie.id}`}>
                  <Button variant="ghost" size="md" className="h-10 px-5 text-sm glass border-white/10 hover:border-white/20">
                    More Info
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Skeleton loading state */
            <div className="max-w-2xl space-y-6">
              <Skeleton className="h-8 w-40 rounded-full" />
              <Skeleton className="h-20 w-3/4" />
              <div className="flex gap-3">
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
              <Skeleton className="h-24 w-full rounded-lg" />
              <div className="flex gap-4 pt-4">
                <Skeleton className="h-14 w-44 rounded-xl" />
                <Skeleton className="h-14 w-36 rounded-xl" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom gradient fade into content */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#05050A] to-transparent z-20 pointer-events-none" />
      </header>

      {/* ═══════════════════════════════════════════════════
          MAIN CONTENT
         ═══════════════════════════════════════════════════ */}
      <main className="flex-1 w-full relative z-30 pb-16 space-y-16">

        {/* ── Trending Movies ─────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2.5">
              <div className="w-0.5 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
              <h2 className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
                Trending Now
              </h2>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </div>
            <Link href="/shows" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors duration-300 flex items-center gap-1 group">
              View All
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </Link>
          </div>

          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-5 scrollbar-hide snap-x">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="min-w-[165px] md:min-w-[190px] snap-start shrink-0 space-y-3">
                  <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))
            ) : (
              trending.map((movie, index) => (
                <div
                  key={movie.id}
                  className="min-w-[165px] md:min-w-[190px] snap-start shrink-0 animate-scale-in"
                  style={{ animationDelay: `${index * 80}ms`, opacity: 0, animationFillMode: 'forwards' }}
                >
                  <MovieCard
                    movie={{
                      ...movie,
                      posterUrl: movie.posterPath ? (movie.posterPath.startsWith('http') ? movie.posterPath : `https://image.tmdb.org/t/p/w500${movie.posterPath}`) : undefined,
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Recommended For You ─────────────────────── */}
        {isAuthenticated && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-2.5">
                <div className="w-0.5 h-6 rounded-full bg-gradient-to-b from-violet-500 to-purple-500" />
                <h2 className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  Recommended For You
                </h2>
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
            </div>

            {loadingRecs ? (
              <div className="flex overflow-x-auto pb-8 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-[165px] md:min-w-[190px] shrink-0 space-y-3">
                    <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="w-full bg-[#0A0A14] border border-[#1A1A2E] rounded-2xl p-8 text-center flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-500/10 to-purple-500/10 border border-violet-500/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>Start building your Taste Profile</h3>
                  <p className="text-slate-500 mt-1.5 mb-4 max-w-sm text-sm leading-relaxed">Log movies you&apos;ve watched and rate them to get personalized recommendations.</p>
                  <Link href="/search"><Button variant="outline">Rate Movies</Button></Link>
                </div>
              </div>
            ) : (
              <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-5 scrollbar-hide snap-x">
                {recommendations.map((movie, index) => (
                  <div
                    key={movie.id}
                    className="min-w-[165px] md:min-w-[190px] snap-start shrink-0 animate-scale-in"
                    style={{ animationDelay: `${index * 80}ms`, opacity: 0, animationFillMode: 'forwards' }}
                  >
                    <MovieCard
                      movie={{
                        ...movie,
                        posterUrl: movie.posterPath ? (movie.posterPath.startsWith('http') ? movie.posterPath : `https://image.tmdb.org/t/p/w500${movie.posterPath}`) : undefined,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Watch Party CTA ──────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="relative rounded-2xl overflow-hidden">
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 via-violet-600/20 to-purple-600/30 rounded-2xl" style={{ padding: '1px' }}>
              <div className="absolute inset-[1px] bg-[#08080F] rounded-2xl" />
            </div>

            {/* Background texture */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=2000&auto=format&fit=crop')] opacity-[0.04] mix-blend-overlay rounded-2xl" />
            
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-600/8 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 md:p-10 gap-8">
              <div className="max-w-lg space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 text-indigo-300 px-3 py-1 text-xs font-semibold border border-indigo-500/20 backdrop-blur-md">
                  <Zap className="w-3 h-3" /> CineVerse Exclusive
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-[1.15]" style={{ fontFamily: 'var(--font-display)' }}>
                  Movie night is<br />
                  <span className="text-gradient-primary">better together.</span>
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Create a Watch Party. Vote on a movie, select adjacent seats, and split the payment instantly.
                </p>
                <div className="pt-2">
                  <Link href="/parties">
                    <Button size="sm" className="h-9 px-5">
                      <Users className="w-4 h-4" />
                      Create Watch Party
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Floating UI preview card */}
              <div className="hidden md:flex flex-col gap-4 w-full max-w-sm">
                <div className="glass rounded-xl p-4 shadow-2xl shadow-black/30 hover-lift">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-white text-xs" style={{ fontFamily: 'var(--font-display)' }}>Split Payment</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Pending</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white">You</div>
                        <span className="text-slate-300 font-medium">Srijan</span>
                      </div>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">₹320 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">R</div>
                        <span className="text-slate-400 font-medium">Rahul</span>
                      </div>
                      <span className="text-slate-600 font-medium">₹320 Pending</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white">A</div>
                        <span className="text-slate-400 font-medium">Ananya</span>
                      </div>
                      <span className="text-slate-600 font-medium">₹320 Pending</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                      <span>Payment Progress</span>
                      <span className="text-indigo-400 font-bold">1/3</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1A1A2E] overflow-hidden">
                      <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ═══════════════════════════════════════════════════
          PREMIUM FOOTER
         ═══════════════════════════════════════════════════ */}
      <footer className="relative border-t border-[#1A1A2E] bg-[#08080F] pt-14 pb-8 text-sm text-slate-500">
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4 text-white">
                <div className="relative">
                  <Play className="h-5 w-5 text-indigo-400 fill-indigo-400" />
                  <div className="absolute inset-0 bg-indigo-500/30 blur-lg rounded-full" />
                </div>
                <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>CineVerse</span>
              </div>
              <p className="text-slate-600 pr-4 text-xs leading-relaxed">
                Discover movies, book premium seats, and connect with film enthusiasts.
              </p>
            </div>
            <div>
              <h4 className="text-slate-300 font-bold mb-3 text-[10px] uppercase tracking-widest">Platform</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/shows" className="hover:text-white transition-colors duration-300">Book Tickets</Link></li>
                <li><Link href="/search" className="hover:text-white transition-colors duration-300">Discover Movies</Link></li>
                <li><Link href="/parties" className="hover:text-white transition-colors duration-300">Watch Parties</Link></li>
                <li><Link href="/assistant" className="hover:text-white transition-colors duration-300">AI Assistant</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-300 font-bold mb-3 text-[10px] uppercase tracking-widest">Account</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/profile" className="hover:text-white transition-colors duration-300">My Profile</Link></li>
                <li><Link href="/profile" className="hover:text-white transition-colors duration-300">Taste Compatibility</Link></li>
                <li><Link href="/profile" className="hover:text-white transition-colors duration-300">Movie Diary</Link></li>
                <li><Link href="/settings" className="hover:text-white transition-colors duration-300">Settings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-300 font-bold mb-3 text-[10px] uppercase tracking-widest">Business</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/theatre-owner" className="hover:text-white transition-colors duration-300">Partner Dashboard</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors duration-300">Admin Console</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#1A1A2E] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600">&copy; {new Date().getFullYear()} CineVerse. Built for high-concurrency ticket booking.</p>
            <div className="flex gap-6 text-xs font-semibold">
              <Link href="#" className="hover:text-white transition-colors duration-300">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors duration-300">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
