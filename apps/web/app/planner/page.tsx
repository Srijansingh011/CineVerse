'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { apiFetch } from '../../lib/api';
import { 
  Sparkles, Calendar, Heart, ShieldCheck, DollarSign, Users, Award, MapPin, Search, Plus, Trash2, ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MovieNightPlannerPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Friends Selection
  const [friendEmail, setFriendEmail] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  
  // Cities List
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  
  // Filter Preferences
  const [maxPrice, setMaxPrice] = useState('350');
  const [startTime, setStartTime] = useState(new Date().toISOString().substring(0, 16));

  // Planning Result State
  const [loading, setLoading] = useState(false);
  const [planResult, setPlanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await apiFetch('/theatres/cities');
        setCities(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedCityId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCities();
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail) return;

    try {
      // In demo/test mode, we simulate friend resolution by searching followers or parsing email
      const mockFriendId = `friend-uuid-${Math.random().toString(36).substring(2, 9)}`;
      setSelectedFriends((prev) => [
        ...prev,
        {
          id: mockFriendId,
          name: friendEmail.split('@')[0],
          email: friendEmail,
        },
      ]);
      setFriendEmail('');
    } catch (err: any) {
      alert(err.message || 'Could not resolve friend');
    }
  };

  const handleRemoveFriend = (id: string) => {
    setSelectedFriends((prev) => prev.filter((f) => f.id !== id));
  };

  const handlePlanMovieNight = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPlanResult(null);

    try {
      const res = await apiFetch('/social/planner', {
        method: 'POST',
        body: JSON.stringify({
          friendIds: selectedFriends.map((f) => f.id),
          cityId: selectedCityId,
          maxPrice: parseFloat(maxPrice),
          startTimeMin: new Date(startTime),
        }),
      });

      setPlanResult(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate group recommendations. Make sure shows are scheduled under these parameters.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickBook = (showId: string, seats: any[]) => {
    const seatsString = seats.map((s) => s.seatId).join(',');
    router.push(`/checkout?showId=${showId}&seats=${seatsString}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <Sparkles className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-sm text-slate-400 mt-2 mb-6">Log in to compute optimized showtimes, taste matching percentages, and seat rows for your movie squad.</p>
            <a href="/login" className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition">
              Log In Now
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="text-center mb-12 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
          <Sparkles className="h-10 w-10 text-indigo-400 mx-auto mb-4 animate-pulse relative z-10" />
          <h1 className="text-4xl font-black tracking-tight text-white relative z-10">Movie Night Planner</h1>
          <p className="text-sm text-slate-400 mt-3 max-w-lg mx-auto leading-relaxed relative z-10">
            The ultimate social coordination engine. Select friends, input ticket price limits, and our algorithms will find the perfect show with adjacent seats.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Planner Setup parameters */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit space-y-6">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-indigo-400" /> Plan Setup
            </h3>

            {/* Friend selector */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold text-slate-500">Group Members</label>
              
              <form onSubmit={handleAddFriend} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Friend's email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs focus:border-indigo-500 outline-none"
                />
                <button type="submit" className="p-1.5 bg-indigo-650 hover:bg-indigo-600 rounded-xl border border-indigo-500/30 transition">
                  <Plus className="h-4 w-4" />
                </button>
              </form>

              {/* Selected Friends Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <div className="bg-indigo-950/40 border border-indigo-900/50 px-2.5 py-1 rounded-full text-[10px] font-bold text-indigo-400">
                  Me (Host)
                </div>
                {selectedFriends.map((f) => (
                  <div key={f.id} className="bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1">
                    <span>{f.name}</span>
                    <button type="button" onClick={() => handleRemoveFriend(f.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Target parameters form */}
            <form onSubmit={handlePlanMovieNight} className="space-y-4 pt-4 border-t border-slate-800/80">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500">Location City</label>
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:border-indigo-500 outline-none"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500">Max Seat Price</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500">Start After</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-[10px] focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 text-white rounded-xl text-xs font-semibold transition"
              >
                {loading ? 'Crunching recommendations...' : 'Generate Group Plan'}
              </button>
            </form>
          </div>

          {/* Planning recommendation cards */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-xs">
                {error}
              </div>
            )}

            {!planResult && !loading && !error && (
              <div className="bg-slate-900/30 border border-dashed border-slate-850 rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center">
                <Sparkles className="h-12 w-12 text-slate-700 mb-4 animate-pulse" />
                <h3 className="text-md font-bold text-slate-300">Run Group Analytics</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  Enter your squad's emails, set budget limits, and see taste-matching projections alongside instantly books of adjacent seating.
                </p>
              </div>
            )}

            {planResult && (
              <div className="space-y-6">
                {/* Compatibility Stats Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Group Size</span>
                    <p className="text-lg font-bold text-slate-200 mt-1">{planResult.groupSize} Users</p>
                  </div>
                  <div className="text-center p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Group Alignment</span>
                    <p className="text-lg font-bold text-indigo-400 mt-1">{planResult.averageTasteCompatibility}%</p>
                  </div>
                  <div className="text-center p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Top Genres</span>
                    <p className="text-xs font-semibold text-slate-200 mt-1.5 truncate">
                      {planResult.groupGenres.join(', ') || 'General'}
                    </p>
                  </div>
                </div>

                {/* Recommendations Loop */}
                <h3 className="text-sm font-bold text-slate-200">Recommended Shows</h3>
                <div className="space-y-4">
                  {planResult.recommendations.length === 0 ? (
                    <p className="text-xs text-slate-500">No shows found under these scheduling constraints.</p>
                  ) : (
                    planResult.recommendations.map((rec: any, idx: number) => (
                      <div key={rec.showId} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/20 transition relative">
                        {idx === 0 && (
                          <span className="absolute top-4 right-4 bg-indigo-950 text-indigo-400 border border-indigo-900 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                            <Award className="h-3 w-3" /> Best Choice
                          </span>
                        )}

                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Movie Choice</span>
                            <h4 className="text-base font-bold text-slate-100 mt-1">{rec.movie.title}</h4>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                              <span className="text-amber-500 font-semibold">{rec.movie.rating} ★</span>
                              <span className="text-slate-500">|</span>
                              <span>{rec.movie.genres.join(', ')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-850">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Theatre</span>
                            <p className="text-xs text-slate-300 font-medium mt-0.5 truncate">{rec.theatre.name}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Showtime</span>
                            <p className="text-xs text-slate-300 font-semibold mt-0.5">
                              {new Date(rec.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Ticket Price</span>
                            <p className="text-xs text-indigo-400 font-bold mt-0.5">₹{rec.pricePerSeat}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Solved Adjacent Seats</span>
                            <p className="text-xs text-indigo-400 font-bold mt-0.5">
                              {rec.adjacentSeats.map((s: any) => `${s.row}${s.number}`).join(', ')}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleQuickBook(rec.showId, rec.adjacentSeats)}
                          className="mt-6 w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          Book Adjacent Seats <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
