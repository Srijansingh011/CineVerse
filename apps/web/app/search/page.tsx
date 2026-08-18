'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { apiFetch } from '../../lib/api';
import { Search, X } from 'lucide-react';
import { MovieCard } from '../../components/movie/MovieCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MovieSkeleton } from '../../components/ui/Skeleton';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { tmdbImage } from '../../lib/media';
import Link from 'next/link';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'movies', label: 'Movies' },
  { id: 'theatres', label: 'Cinemas' },
  { id: 'users', label: 'Users' },
  { id: 'lists', label: 'Lists' },
  { id: 'reviews', label: 'Reviews' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [unified, setUnified] = useState<any>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [minRating, setMinRating] = useState('All');

  const genres = ['All', 'Action', 'Adventure', 'Science Fiction', 'Drama', 'Thriller', 'Animation', 'Comedy', 'Horror', 'Romance'];
  const languages = ['All', 'en', 'hi', 'es', 'fr', 'ko', 'ja'];

  useEffect(() => {
    const t = setTimeout(async () => {
      setIsLoading(true);
      try {
        if (query.trim()) {
          const type = tab === 'all' ? 'all' : tab === 'cinemas' ? 'theatres' : tab;
          const res = await apiFetch(`/search?q=${encodeURIComponent(query)}&type=${type}&limit=24`);
          setUnified(res.data);
          const movieHits = (res.data?.results || []).filter((r: any) => r._type === 'movie' || r.title);
          if (tab === 'movies' || tab === 'all') {
            setMovies(movieHits.length ? movieHits : []);
          }
        } else {
          const res = await apiFetch('/movies/trending');
          setMovies(res.data || []);
          setUnified(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, tab]);

  const filteredMovies = movies.filter((movie) => {
    const genreMatch = selectedGenre === 'All' || movie.genres?.includes(selectedGenre);
    const langMatch = selectedLanguage === 'All' || movie.language === selectedLanguage;
    const ratingMatch = minRating === 'All' || (movie.rating && movie.rating >= parseFloat(minRating));
    return genreMatch && langMatch && ratingMatch;
  });

  const results = unified?.results || [];
  const theatres = results.filter((r: any) => r._type === 'theatre');
  const users = results.filter((r: any) => r._type === 'user');
  const lists = results.filter((r: any) => r._type === 'list');
  const reviews = results.filter((r: any) => r._type === 'review');

  return (
    <PageShell>
      <main className="cv-container cv-page space-y-6">
        <div>
          <h1 className="font-display text-[36px] text-white">Search</h1>
          <p className="mt-1 text-[15px] text-muted">Movies, cinemas, people, lists, and reviews.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, actors, cinemas..."
            className="h-12 pl-12 pr-10 text-[16px]"
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <Tabs items={TABS} value={tab} onChange={setTab} />

        {(tab === 'all' || tab === 'movies') && (
          <div className="flex flex-wrap gap-2">
            <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="h-9 rounded-[6px] border border-[var(--border)] bg-surface px-2 text-[13px]">
              {genres.map((g) => <option key={g} value={g}>{g === 'All' ? 'Genre' : g}</option>)}
            </select>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="h-9 rounded-[6px] border border-[var(--border)] bg-surface px-2 text-[13px]">
              {languages.map((l) => <option key={l} value={l}>{l === 'All' ? 'Language' : l.toUpperCase()}</option>)}
            </select>
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="h-9 rounded-[6px] border border-[var(--border)] bg-surface px-2 text-[13px]">
              <option value="All">Rating</option>
              <option value="4">4.0+</option>
              <option value="3">3.0+</option>
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <MovieSkeleton key={i} />)}
          </div>
        ) : (
          <>
            {(tab === 'all' || tab === 'movies') && (
              filteredMovies.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
                  {filteredMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={{
                        ...movie,
                        posterUrl: tmdbImage(movie.posterPath) || undefined,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No movies found" description="Try another title, genre, or language." action={
                  <Button variant="outline" size="sm" onClick={() => { setQuery(''); setSelectedGenre('All'); setSelectedLanguage('All'); }}>Clear filters</Button>
                } />
              )
            )}

            {tab === 'theatres' && (
              theatres.length ? theatres.map((t: any) => (
                <Link key={t.id} href="/shows" className="block py-3 border-b border-[var(--border)]">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-[13px] text-muted">{t.address} · {t.city?.name}</p>
                </Link>
              )) : <EmptyState title="No cinemas match" description="Search by cinema name or area." />
            )}

            {tab === 'users' && (
              users.length ? users.map((u: any) => (
                <div key={u.id} className="py-3 border-b border-[var(--border)]">
                  <p className="font-medium">{u.name || u.email}</p>
                  <p className="text-[13px] text-muted">Level {u.level} · {u.xp} XP</p>
                </div>
              )) : <EmptyState title="No people found" />
            )}

            {tab === 'lists' && (
              lists.length ? lists.map((l: any) => (
                <div key={l.id} className="py-3 border-b border-[var(--border)]">
                  <p className="font-medium">{l.name}</p>
                  <p className="text-[13px] text-muted">{l.description}</p>
                </div>
              )) : <EmptyState title="No lists found" />
            )}

            {tab === 'reviews' && (
              reviews.length ? reviews.map((r: any) => (
                <div key={r.id} className="py-3 border-b border-[var(--border)]">
                  <p className="text-[13px] text-muted">{r.user?.name} · {r.movie?.title}</p>
                  <p className="mt-1 text-[15px]">{r.content}</p>
                </div>
              )) : <EmptyState title="No reviews found" />
            )}
          </>
        )}
      </main>
    </PageShell>
  );
}
