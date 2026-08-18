'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '../../components/Navbar';
import { apiFetch } from '../../lib/api';
import { useSearchParams } from 'next/navigation';
import { Calendar, MapPin, Film, Armchair, ChevronRight, Clock, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';

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

  // Generate next 7 days for filtering
  const dateFilters = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: (d.toISOString().split('T')[0] || '') as string,
      dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
      dateNum: d.getDate(),
      month: d.toLocaleDateString(undefined, { month: 'short' })
    };
  });

  // Fetch cities and movies initially
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const citiesRes = await apiFetch('/theatres/cities');
        const moviesRes = await apiFetch('/movies/trending');
        
        setCities(citiesRes.data || []);
        setMovies(moviesRes.data || []);
        
        if (citiesRes.data?.length > 0) {
          setSelectedCity((citiesRes.data[0].id || '') as string);
        }
      } catch (err) {
        console.error('Failed to load initial scheduling filters:', err);
      }
    };
    fetchInitialData();
  }, []);

  // Keep the selected movie in sync with the URL param so deep links
  // (e.g. the "Book Tickets" button: /shows?movie=<id>) reliably preselect.
  useEffect(() => {
    const movieParam = searchParams.get('movie');
    if (movieParam && movieParam !== selectedMovieId) {
      setSelectedMovieId(movieParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch movie details if selectedMovieId changes
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

  // Fetch shows
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
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch shows. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchShows();
  }, [selectedMovieId, selectedCity, selectedDate]);

  return (
    <div className="min-h-screen bg-[#05050A] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full space-y-10">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Book <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Tickets</span>
          </h1>
          <p className="text-lg text-slate-400">Select a city, choose a movie, and find the best showtimes near you.</p>
        </div>

        {/* Filters Panel */}
        <div className="bg-[#0A0A12] border border-[#1E1E2E] rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
          {/* City Selection */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
              <MapPin className="h-3.5 w-3.5 text-indigo-400" />
              Select City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full h-14 rounded-2xl border border-[#1E1E2E] bg-[#05050A] px-4 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer appearance-none transition-all shadow-inner"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
            >
              {cities.length === 0 ? (
                <option value="">No cities available</option>
              ) : (
                cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))
              )}
            </select>
          </div>

          {/* Movie Selection */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
              <Film className="h-3.5 w-3.5 text-indigo-400" />
              Select Movie
            </label>
            <select
              value={selectedMovieId}
              onChange={(e) => setSelectedMovieId(e.target.value)}
              className="w-full h-14 rounded-2xl border border-[#1E1E2E] bg-[#05050A] px-4 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer appearance-none transition-all shadow-inner"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
            >
              <option value="">-- Choose a movie --</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

          {/* Date Picker (Builtin fallback) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              Choose Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-14 rounded-2xl border border-[#1E1E2E] bg-[#05050A] px-4 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Date Tabs (Next 7 Days Slider) */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {dateFilters.map((tab) => {
            const isActive = tab.value === selectedDate;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedDate(tab.value)}
                className={`
                  flex-shrink-0 flex flex-col items-center justify-center w-20 py-4 rounded-2xl border transition-all duration-300 snap-start
                  ${isActive 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' 
                    : 'bg-[#0A0A12] border-[#1E1E2E] text-slate-400 hover:border-slate-700 hover:text-slate-200'}
                `}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider">{tab.month}</span>
                <span className="text-2xl font-black mt-1 mb-1">{tab.dateNum}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider">{tab.dayName}</span>
              </button>
            );
          })}
        </div>

        {/* Layout: Selected Movie Card + Theatres list */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-start pt-6">
          {/* Selected Movie Sidebar */}
          <div className="xl:col-span-4 sticky top-32">
            {selectedMovie ? (
              <div className="rounded-3xl border border-[#1E1E2E] bg-[#0A0A12] overflow-hidden shadow-2xl flex flex-col">
                <div className="aspect-[16/9] w-full relative bg-slate-950">
                  <img
                    src={selectedMovie.backdropPath 
                      ? (/^(https?:|\/demo\/)/.test(selectedMovie.backdropPath) ? selectedMovie.backdropPath : `https://image.tmdb.org/t/p/w500${selectedMovie.backdropPath}`)
                      : (selectedMovie.posterPath 
                          ? (/^(https?:|\/demo\/)/.test(selectedMovie.posterPath) ? selectedMovie.posterPath : `https://image.tmdb.org/t/p/w500${selectedMovie.posterPath}`)
                          : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop')}
                    alt={selectedMovie.title}
                    className="h-full w-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A12] to-transparent" />
                </div>
                
                <div className="p-6 -mt-12 relative z-10 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-20 shrink-0 rounded-lg overflow-hidden border border-[#1E1E2E] shadow-xl">
                      <img
                        src={selectedMovie.posterPath 
                          ? (/^(https?:|\/demo\/)/.test(selectedMovie.posterPath) ? selectedMovie.posterPath : `https://image.tmdb.org/t/p/w500${selectedMovie.posterPath}`)
                          : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop'}
                        alt={selectedMovie.title}
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-xl font-bold text-white leading-tight">{selectedMovie.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                        {selectedMovie.rating && (
                          <span className="flex items-center gap-1 text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                            <Star className="w-3 h-3 fill-amber-500" /> {selectedMovie.rating.toFixed(1)}
                          </span>
                        )}
                        <span>{selectedMovie.runtime}m</span>
                        <span className="uppercase">{selectedMovie.language}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMovie.genres?.map((g: string) => (
                      <span key={g} className="text-[10px] font-medium bg-[#1E1E2E] text-slate-300 px-2 py-1 rounded-md">
                        {g}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-slate-400 font-light leading-relaxed line-clamp-3">
                    {selectedMovie.overview}
                  </p>
                  
                  <Link href={`/movies/${selectedMovie.id}`} className="block pt-2">
                    <Button variant="outline" className="w-full group">
                      More Details <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#1E1E2E] bg-[#0A0A12]/50 p-12 text-center text-slate-500 flex flex-col items-center">
                <Film className="h-12 w-12 opacity-40 mb-4" />
                <p className="text-sm font-medium">Choose a movie to check shows</p>
              </div>
            )}
          </div>

          {/* Theatres & Showtimes Listings */}
          <div className="xl:col-span-8 space-y-6">
            {!selectedMovieId ? (
              <div className="text-center py-24 bg-[#0A0A12] border border-[#1E1E2E] rounded-3xl flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-[#1E1E2E] flex items-center justify-center mb-6">
                  <Film className="h-10 w-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Select a Movie to start</h3>
                <p className="text-sm text-slate-400 max-w-sm">We'll scan nearby cinemas for available seats and showtimes for your selected date.</p>
              </div>
            ) : isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[#0A0A12] border border-[#1E1E2E] rounded-3xl p-6">
                    <Skeleton className="h-8 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/4 mb-6" />
                    <Skeleton className="h-px w-full bg-[#1E1E2E] mb-6" />
                    <div className="flex gap-4">
                      <Skeleton className="h-12 w-24 rounded-xl" />
                      <Skeleton className="h-12 w-24 rounded-xl" />
                      <Skeleton className="h-12 w-24 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400">
                <p className="text-sm font-semibold">{error}</p>
              </div>
            ) : theatres.length > 0 ? (
              <div className="space-y-6">
                {theatres.map((theatre) => (
                  <div 
                    key={theatre.id} 
                    className="rounded-3xl border border-[#1E1E2E] bg-[#0A0A12] overflow-hidden"
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {theatre.name}
                          </h3>
                          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" /> {theatre.address}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-slate-400 border-[#1E1E2E]">
                          {theatre.screens.length} Screens
                        </Badge>
                      </div>

                      {/* Screens within this theatre that have shows */}
                      <div className="space-y-8">
                        {theatre.screens.map((screen: any, idx: number) => {
                          if (screen.shows.length === 0) return null;
                          return (
                            <div key={screen.id} className={idx > 0 ? "pt-6 border-t border-[#1E1E2E]" : ""}>
                              <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                                  {screen.name}
                                </span>
                                <span className="text-xs text-slate-500">4K Dolby Atmos</span>
                              </div>

                              <div className="flex flex-wrap gap-4">
                                {screen.shows.map((show: any) => {
                                  const timeStr = new Date(show.startTime).toLocaleTimeString(undefined, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  });

                                  return (
                                    <Link
                                      key={show.id}
                                      href={`/shows/${show.id}`}
                                      className="group relative rounded-xl border border-[#1E1E2E] bg-[#05050A] hover:border-indigo-500 hover:bg-indigo-500/10 px-5 py-3 transition-all duration-300 shadow-sm"
                                    >
                                      <span className="block text-base font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                                        {timeStr}
                                      </span>
                                      <span className="block text-[10px] text-slate-500 font-mono mt-1 group-hover:text-indigo-300/70 transition-colors">
                                        ₹{show.priceStandard} Std
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-[#0A0A12] border border-[#1E1E2E] rounded-3xl flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-[#1E1E2E] flex items-center justify-center mb-6">
                  <Armchair className="h-10 w-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No shows found</h3>
                <p className="text-sm text-slate-400 max-w-sm">There are no shows playing for this movie on the selected date in {cities.find(c => c.id === selectedCity)?.name || 'this city'}.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ShowsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#05050A] text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-4 text-center font-medium text-slate-400">
            <Armchair className="h-10 w-10 text-indigo-500 animate-bounce mx-auto" />
            <p className="text-sm">Loading scheduler...</p>
          </div>
        </div>
      </div>
    }>
      <ShowsContent />
    </Suspense>
  );
}
