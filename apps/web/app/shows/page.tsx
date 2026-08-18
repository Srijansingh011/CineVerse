'use client';

import { useState, useEffect, Suspense } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { apiFetch } from '../../lib/api';
import { useSearchParams } from 'next/navigation';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { tmdbImage, movieRuntime, movieOverview } from '../../lib/media';
import { formatRuntime, formatYear } from '../../lib/format';
import { cn } from '../../lib/cn';

function ShowsContent() {
  const searchParams = useSearchParams();
  const initialMovieId = searchParams.get('movie') || '';

  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [movies, setMovies] = useState<any[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<string>(initialMovieId);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    (new Date().toISOString().split('T')[0] || '') as string
  );
  const [theatres, setTheatres] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateFilters = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: (d.toISOString().split('T')[0] || '') as string,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short' }),
      dateNum: d.getDate(),
      month: d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    };
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const citiesRes = await apiFetch('/theatres/cities');
        const moviesRes = await apiFetch('/movies/trending');
        setCities(citiesRes.data || []);
        setMovies(moviesRes.data || []);
        const saved = typeof window !== 'undefined' ? localStorage.getItem('cv-city') : null;
        const parsed = saved ? JSON.parse(saved) : null;
        const match = (citiesRes.data || []).find((c: any) => c.id === parsed?.id);
        if (match) setSelectedCity(match.id);
        else if (citiesRes.data?.length > 0) setSelectedCity(citiesRes.data[0].id);
      } catch (err) {
        console.error('Failed to load filters:', err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedMovieId) {
      setSelectedMovie(null);
      return;
    }
    const fetchSelectedMovie = async () => {
      try {
        const res = await apiFetch(`/movies/${selectedMovieId}`);
        setSelectedMovie(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSelectedMovie();
  }, [selectedMovieId]);

  useEffect(() => {
    if (!selectedMovieId || !selectedCity || !selectedDate) {
      setTheatres([]);
      return;
    }
    const fetchShows = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiFetch(
          `/theatres/shows/movie/${selectedMovieId}?cityId=${selectedCity}&date=${selectedDate}`
        );
        setTheatres(res.data || []);
      } catch {
        setError('Couldn’t load showtimes. Please retry.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchShows();
  }, [selectedMovieId, selectedCity, selectedDate]);

  const poster = tmdbImage(selectedMovie?.posterPath, "w185");

  return (
    <PageShell>
      <main className="cv-container cv-page space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[36px] text-white">Showtimes</h1>
            <p className="mt-1 text-[15px] text-muted">Choose a film, date, and cinema.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-10 rounded-[6px] border border-[var(--border)] bg-surface px-3 text-[13px]"
            >
              {cities.length === 0 ? <option value="">No cities</option> : cities.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
            <select
              value={selectedMovieId}
              onChange={(e) => setSelectedMovieId(e.target.value)}
              className="h-10 min-w-[180px] rounded-[6px] border border-[var(--border)] bg-surface px-3 text-[13px]"
            >
              <option value="">Select movie</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedMovie && (
          <div className="flex gap-4 items-start">
            {poster ? (
              <div className="relative w-16 aspect-[2/3] rounded-[6px] overflow-hidden shrink-0">
                <Image src={poster} alt="" fill className="object-cover" sizes="64px" />
              </div>
            ) : null}
            <div>
              <h2 className="text-[18px] font-semibold">{selectedMovie.title}</h2>
              <p className="text-[13px] text-muted mt-0.5">
                {[formatYear(selectedMovie.releaseDate), formatRuntime(movieRuntime(selectedMovie)), selectedMovie.language].filter(Boolean).join(' · ')}
              </p>
              <p className="text-[13px] text-muted mt-2 line-clamp-2 max-w-xl">{movieOverview(selectedMovie)}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {dateFilters.map((tab) => {
            const isActive = tab.value === selectedDate;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedDate(tab.value)}
                className={cn(
                  "shrink-0 min-w-[72px] px-3 py-2.5 rounded-[8px] border text-left transition-colors",
                  isActive ? "border-primary bg-primary/10 text-white" : "border-[var(--border)] text-muted hover:text-white"
                )}
              >
                <span className="block text-[11px] font-semibold uppercase tracking-wide">{tab.label}</span>
                <span className="block text-[20px] font-semibold leading-tight mt-0.5">{tab.dateNum}</span>
                <span className="block text-[11px]">{tab.month}</span>
              </button>
            );
          })}
        </div>

        {!selectedMovieId ? (
          <EmptyState title="Select a movie" description="Showtimes appear once you pick a title." />
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <Alert action={<Button size="sm" variant="outline" onClick={() => setSelectedDate(selectedDate)}>Retry</Button>}>
            {error}
          </Alert>
        ) : theatres.length > 0 ? (
          <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {theatres.map((theatre) => (
              <div key={theatre.id} className="py-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-[16px] font-semibold">{theatre.name}</h3>
                    <p className="text-[13px] text-muted mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {theatre.address}
                    </p>
                  </div>
                </div>
                {theatre.screens.map((screen: any) => {
                  if (screen.shows.length === 0) return null;
                  return (
                    <div key={screen.id} className="mt-3">
                      <p className="text-[12px] text-muted mb-2">{screen.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {screen.shows.map((show: any) => {
                          const timeStr = new Date(show.startTime).toLocaleTimeString(undefined, {
                            hour: 'numeric',
                            minute: '2-digit',
                          });
                          return (
                            <Link
                              key={show.id}
                              href={`/shows/${show.id}`}
                              className="min-w-[88px] px-3 py-2 rounded-[6px] border border-[var(--border)] text-center hover:border-primary hover:text-white transition-colors"
                            >
                              <span className="block text-[14px] font-semibold">{timeStr}</span>
                              <span className="block text-[11px] text-muted mt-0.5">₹{show.priceStandard}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No shows available"
            description="Try another date or cinema."
            action={<Button variant="outline" size="sm" onClick={() => setSelectedDate(dateFilters[0]?.value || selectedDate)}>Change date</Button>}
          />
        )}
      </main>
    </PageShell>
  );
}

export default function ShowsPage() {
  return (
    <Suspense fallback={<PageShell><div className="cv-container cv-page"><Skeleton className="h-40 w-full" /></div></PageShell>}>
      <ShowsContent />
    </Suspense>
  );
}
