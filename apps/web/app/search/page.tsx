'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { apiFetch } from '../../lib/api';
import { Search, Film, Filter, X } from 'lucide-react';
import { MovieCard } from '../../components/movie/MovieCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');

  const genres = ['All', 'Action', 'Adventure', 'Science Fiction', 'Drama', 'Thriller', 'Animation', 'Comedy', 'Horror', 'Romance'];
  const languages = ['All', 'en', 'hi', 'es', 'fr', 'ko', 'ja'];

  const handleSearch = async (searchVal: string) => {
    setIsLoading(true);
    try {
      const endpoint = searchVal.trim() 
        ? `/movies/search?q=${encodeURIComponent(searchVal)}` 
        : '/movies/trending';
      const res = await apiFetch(endpoint);
      setMovies(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const filteredMovies = movies.filter((movie) => {
    const genreMatch = selectedGenre === 'All' || (movie.genres && movie.genres.includes(selectedGenre));
    const langMatch = selectedLanguage === 'All' || movie.language === selectedLanguage;
    return genreMatch && langMatch;
  });

  return (
    <div className="min-h-screen bg-[#05050A] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full space-y-10">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Discover Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Masterpiece</span>
          </h1>
          <p className="text-lg text-slate-400">Search through our extensive catalog of movies, or filter by your favorite genre to find exactly what you're looking for.</p>
        </div>

        {/* Search Bar + Filters */}
        <div className="bg-[#0A0A12] border border-[#1E1E2E] rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row gap-6 shadow-xl">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, director, or cast..."
              className="w-full h-14 pl-12 rounded-2xl bg-[#05050A] border-[#1E1E2E] text-base focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 lg:w-96">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full h-14 rounded-2xl border border-[#1E1E2E] bg-[#05050A] px-4 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer appearance-none transition-all"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
              >
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full h-14 rounded-2xl border border-[#1E1E2E] bg-[#05050A] px-4 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer appearance-none transition-all"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
              >
                {languages.map((l) => (
                  <option key={l} value={l}>{l === 'All' ? 'All' : l.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#1E1E2E] pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-400" />
              {isLoading ? 'Searching...' : `Found ${filteredMovies.length} results`}
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredMovies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
              {filteredMovies.map((movie) => (
                <MovieCard 
                  key={movie.id} 
                  movie={{
                    ...movie,
                    posterUrl: movie.posterPath 
                      ? (/^(https?:|\/demo\/)/.test(movie.posterPath) ? movie.posterPath : `https://image.tmdb.org/t/p/w500${movie.posterPath}`)
                      : undefined
                  }} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-[#0A0A12] border border-[#1E1E2E] rounded-3xl">
              <div className="rounded-full bg-[#1E1E2E] p-6 text-slate-500">
                <Film className="h-12 w-12" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">No movies found</h3>
                <p className="text-base text-slate-400 max-w-sm mx-auto">We couldn't find any movies matching your current filters. Try adjusting your search or clearing filters.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => { setQuery(''); setSelectedGenre('All'); setSelectedLanguage('All'); }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
