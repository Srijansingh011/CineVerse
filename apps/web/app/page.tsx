'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PageShell } from '../components/layout/PageShell';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../lib/api';
import { Star, MapPin } from 'lucide-react';
import { MovieCard } from '../components/movie/MovieCard';
import { MovieRow } from '../components/movie/MovieRow';
import { Button } from '../components/ui/Button';
import { Skeleton, MovieSkeleton } from '../components/ui/Skeleton';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { tmdbImage, movieRuntime, movieOverview } from '../lib/media';
import { formatRuntime, formatYear, initials } from '../lib/format';

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const [trending, setTrending] = useState<any[]>([]);
  const [nowPlaying, setNowPlaying] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [theatres, setTheatres] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [trendRes, nowRes, upRes] = await Promise.all([
          apiFetch('/movies/trending'),
          apiFetch('/movies/now-playing').catch(() => ({ data: [] })),
          apiFetch('/movies/upcoming').catch(() => ({ data: [] })),
        ]);
        const trend = trendRes.data || [];
        setTrending(trend);
        setNowPlaying(nowRes.data?.length ? nowRes.data : trend);
        setUpcoming(upRes.data || []);

        const saved = typeof window !== 'undefined' ? localStorage.getItem('cv-city') : null;
        const city = saved ? JSON.parse(saved) : null;
        if (trend[0]?.id && city?.id) {
          const date = new Date().toISOString().split('T')[0];
          try {
            const shows = await apiFetch(`/theatres/shows/movie/${trend[0].id}?cityId=${city.id}&date=${date}`);
            setTheatres((shows.data || []).slice(0, 4));
          } catch {
            setTheatres([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch movies:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const loadAuth = async () => {
      try {
        const [recRes, feedRes] = await Promise.all([
          apiFetch('/movies/recommendations').catch(() => ({ data: [] })),
          apiFetch('/social/feed').catch(() => ({ data: [] })),
        ]);
        const mapped = (recRes.data || []).map((m: any) => ({
          ...m.movie,
          matchScore: m.score,
        }));
        setRecommendations(mapped);
        setFeed(Array.isArray(feedRes.data) ? feedRes.data.slice(0, 3) : []);
      } catch {
        // ignore
      }
    };
    loadAuth();
  }, [isAuthenticated, user]);

  const heroMovie = trending[heroIndex] || trending[0];
  const featured = trending.slice(0, 1)[0];
  const featuredRest = trending.slice(1, 5);

  return (
    <PageShell>
      <header className="relative w-full h-[520px] md:h-[560px] overflow-hidden">
        {heroMovie ? (
          <>
            <div className="absolute inset-0">
              {tmdbImage(heroMovie.backdropPath, "original") ? (
                <Image
                  src={tmdbImage(heroMovie.backdropPath, "original")!}
                  alt=""
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0f] via-[#0b0b0f]/70 to-[#0b0b0f]/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/30 to-transparent" />
            </div>
            <div className="relative z-10 cv-container h-full flex items-center">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted mb-3">Now trending</p>
                <h1 className="font-display text-[40px] md:text-[44px] leading-[1.1] text-white">
                  {heroMovie.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                  {heroMovie.rating ? (
                    <span className="text-highlight font-semibold">★ {heroMovie.rating.toFixed(1)}</span>
                  ) : null}
                  {formatYear(heroMovie.releaseDate) ? <span>{formatYear(heroMovie.releaseDate)}</span> : null}
                  {formatRuntime(movieRuntime(heroMovie)) ? <span>{formatRuntime(movieRuntime(heroMovie))}</span> : null}
                  {heroMovie.genres?.slice(0, 3).map((g: string) => (
                    <span key={g}>{g}</span>
                  ))}
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-muted line-clamp-3 max-w-lg">
                  {movieOverview(heroMovie)}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href={`/shows?movie=${heroMovie.id}`}>
                    <Button>Book tickets</Button>
                  </Link>
                  <Link href={`/movies/${heroMovie.id}`}>
                    <Button variant="outline">Watch trailer</Button>
                  </Link>
                  <Link href={`/movies/${heroMovie.id}`}>
                    <Button variant="ghost">+ Add to list</Button>
                  </Link>
                </div>
              </div>
            </div>
            {trending.length > 1 && (
              <div className="absolute bottom-6 right-6 z-10 hidden md:flex gap-1.5">
                {trending.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show movie ${i + 1}`}
                    onClick={() => setHeroIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${i === heroIndex ? "w-6 bg-white" : "w-1.5 bg-white/30"}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="cv-container h-full flex items-center">
            <div className="w-full max-w-xl space-y-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="cv-container cv-section">
          <SectionHeader eyebrow="Editorial" title="Trending now" href="/search" />
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-12 gap-4">
              <div className="col-span-2 md:col-span-6"><MovieSkeleton /></div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="md:col-span-3"><MovieSkeleton /></div>
              ))}
            </div>
          ) : featured ? (
            <div className="grid grid-cols-2 md:grid-cols-12 gap-4 md:gap-5">
              <div className="col-span-2 md:col-span-6">
                <MovieCard movie={featured} variant="large" />
              </div>
              {featuredRest.map((movie) => (
                <div key={movie.id} className="md:col-span-3">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No movies yet" description="Trending titles will appear here once the catalogue is synced." />
          )}
        </section>

        <section className="cv-container cv-section">
          <SectionHeader title="Now showing" href="/shows" />
          <MovieRow movies={nowPlaying} loading={isLoading} />
        </section>

        {upcoming.length > 0 && (
          <section className="cv-container cv-section">
            <SectionHeader title="Coming soon" href="/search" />
            <MovieRow movies={upcoming} />
          </section>
        )}

        <section className="cv-container cv-section">
          <SectionHeader title="Recommended for you" />
          {isAuthenticated ? (
            recommendations.length > 0 ? (
              <MovieRow movies={recommendations} />
            ) : (
              <EmptyState
                title="Rate a few films"
                description="Log movies you’ve watched to unlock personal recommendations."
                action={<Link href="/search"><Button variant="outline" size="sm">Browse movies</Button></Link>}
              />
            )
          ) : (
            <EmptyState
              title="Sign in for recommendations"
              description="We’ll match titles to your taste once you have an account."
              action={<Link href="/login"><Button size="sm">Sign in</Button></Link>}
            />
          )}
        </section>

        <section className="cv-container cv-section">
          <SectionHeader title="Popular cinemas" href="/shows" />
          {theatres.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {theatres.map((t: any) => (
                <Link key={t.id} href="/shows" className="border border-[var(--border)] rounded-[8px] p-4 hover:border-white/20 transition-colors">
                  <p className="font-semibold text-[15px] text-white">{t.name}</p>
                  <p className="mt-1 text-[13px] text-muted flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {t.address}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Find a cinema near you"
              description="Pick a city and movie to see today’s showtimes."
              action={<Link href="/shows"><Button variant="outline" size="sm">Browse cinemas</Button></Link>}
            />
          )}
        </section>

        <section className="cv-container cv-section">
          <SectionHeader title="From the community" href="/community" />
          {feed.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {feed.map((item: any) => (
                <div key={item.id || item.createdAt} className="border border-[var(--border)] rounded-[8px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-full bg-surface-2 flex items-center justify-center text-[11px] font-semibold">
                      {initials(item.user?.name, item.user?.email)}
                    </div>
                    <p className="text-[13px] text-muted">
                      <span className="text-white font-medium">{item.user?.name || 'Member'}</span>
                      {item.rating ? ` rated ${item.rating}` : ' posted'}
                    </p>
                  </div>
                  {item.movie?.title ? <p className="font-semibold text-[15px]">{item.movie.title}</p> : null}
                  {item.content ? <p className="mt-1 text-[14px] text-muted line-clamp-3">{item.content}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="A quieter feed today"
              description="Follow friends and write reviews to see activity here."
              action={<Link href="/community"><Button variant="outline" size="sm">Open community</Button></Link>}
            />
          )}
        </section>

        <section className="cv-container cv-section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-[var(--border)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted mb-2">Watch party</p>
              <h2 className="font-display text-[28px] text-white">Share a row. Split the bill.</h2>
              <p className="mt-2 text-[15px] text-muted max-w-md">
                Invite friends, vote on a film, lock adjacent seats, and pay separately.
              </p>
              <Link href="/parties" className="inline-block mt-5">
                <Button>Start a party</Button>
              </Link>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted mb-2">Planner</p>
              <h2 className="font-display text-[28px] text-white">Movie night, decided.</h2>
              <p className="mt-2 text-[15px] text-muted max-w-md">
                Match tastes, pick a cinema, and leave with a showtime that works for the group.
              </p>
              <Link href="/planner" className="inline-block mt-5">
                <Button variant="outline">Plan a night</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
