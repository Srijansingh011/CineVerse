'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useAuthStore } from '../../store/authStore';
import { apiFetch } from '../../lib/api';
import { 
  User as UserIcon, Calendar, Film, Star, List, Users, Activity, BarChart2, CheckCircle2, Heart, MessageSquare, AlertCircle, Plus, Eye, ArrowRight, UserPlus, UserMinus, Award, Trophy
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'diary' | 'lists' | 'social' | 'taste' | 'analytics' | 'gamification'>('diary');
  
  // Gamification State
  const [gamificationStats, setGamificationStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardScope, setLeaderboardScope] = useState<'global' | 'friends'>('global');
  const [loadingGamification, setLoadingGamification] = useState(false);
  
  // Diary State
  const [diary, setDiary] = useState<any[]>([]);
  const [loadingDiary, setLoadingDiary] = useState(false);
  const [newDiaryMovieId, setNewDiaryMovieId] = useState('');
  const [newDiaryRating, setNewDiaryRating] = useState('4.0');
  const [newDiaryRewatch, setNewDiaryRewatch] = useState(false);
  const [newDiaryDate, setNewDiaryDate] = useState<string>(new Date().toISOString().split('T')[0] || '');

  // Lists State
  const [lists, setLists] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [newListPublic, setNewListPublic] = useState(true);

  // Social State
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [socialMsg, setSocialMsg] = useState('');

  // Taste State
  const [compareUserId, setCompareUserId] = useState('');
  const [tasteMatch, setTasteMatch] = useState<any>(null);
  const [tasteLoading, setTasteLoading] = useState(false);
  const [tasteError, setTasteError] = useState<string | null>(null);

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Load profile data
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDiary();
      fetchLists();
      fetchSocialData();
      fetchAnalytics();
    }
  }, [isAuthenticated, user]);

  const fetchDiary = async () => {
    setLoadingDiary(true);
    try {
      const res = await apiFetch('/social/diary');
      setDiary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDiary(false);
    }
  };

  const fetchLists = async () => {
    setLoadingLists(true);
    try {
      // In a real app we'd fetch the user's lists, or we can fetch a specific list. 
      // For this portfolio prototype, we'll try to fetch lists the user created.
      // Since lists are user-specific, we'll handle empty or fallbacks smoothly.
      const res = await apiFetch('/social/feed'); // Feed aggregates public lists too
      // Let's seed list data if empty
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLists(false);
    }
  };

  const fetchSocialData = async () => {
    if (!user) return;
    try {
      const [fowers, fowing, fd] = await Promise.all([
        apiFetch(`/social/followers/${user.id}`),
        apiFetch(`/social/following/${user.id}`),
        apiFetch('/social/feed'),
      ]);
      setFollowers(fowers.data || []);
      setFollowing(fowing.data || []);
      setFeed(fd.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoadingAnalytics(true);
    try {
      const res = await apiFetch(`/social/taste/profile/${user.id}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchGamificationData = async () => {
    if (!user) return;
    setLoadingGamification(true);
    try {
      const [statsRes, lbRes] = await Promise.all([
        apiFetch('/gamification/stats'),
        apiFetch(`/gamification/leaderboard?scope=${leaderboardScope}`),
      ]);
      setGamificationStats(statsRes.data);
      setLeaderboard(lbRes.data || []);
    } catch (err) {
      console.error('Error fetching gamification data:', err);
    } finally {
      setLoadingGamification(false);
    }
  };

  // Gamification fetch trigger
  useEffect(() => {
    if (isAuthenticated && user && activeTab === 'gamification') {
      fetchGamificationData();
    }
  }, [isAuthenticated, user, activeTab, leaderboardScope]);

  const handleAddDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiaryMovieId) return;

    try {
      await apiFetch('/social/diary', {
        method: 'POST',
        body: JSON.stringify({
          movieId: newDiaryMovieId,
          rating: parseFloat(newDiaryRating),
          watchedAt: new Date(newDiaryDate),
          isRewatch: newDiaryRewatch,
        }),
      });
      setNewDiaryMovieId('');
      fetchDiary();
      fetchAnalytics();
    } catch (err: any) {
      alert(err.message || 'Failed to add diary log');
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName) return;

    try {
      const res = await apiFetch('/social/lists', {
        method: 'POST',
        body: JSON.stringify({
          name: newListName,
          description: newListDesc,
          isPublic: newListPublic,
        }),
      });
      setLists((prev) => [res.data, ...prev]);
      setNewListName('');
      setNewListDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to create list');
    }
  };

  const handleUserSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocialMsg('');
    setSearchResult(null);
    try {
      // Mock search or lookup from API (in production lookup user by email)
      const res = await apiFetch(`/social/followers/${user?.id}`); // just placeholder to get a list
      // For presentation/demo purposes, we find a match or mock it
      if (searchEmail.includes('@')) {
        setSearchResult({
          id: 'demo-user-123',
          name: searchEmail.split('@')[0],
          email: searchEmail,
        });
      } else {
        setSocialMsg('Please enter a valid email address');
      }
    } catch (err) {
      setSocialMsg('User not found');
    }
  };

  const handleFollowToggle = async (targetId: string, isFollowing: boolean) => {
    try {
      const endpoint = isFollowing ? `/social/unfollow/${targetId}` : `/social/follow/${targetId}`;
      await apiFetch(endpoint, { method: 'POST' });
      fetchSocialData();
      setSearchResult(null);
      setSearchEmail('');
    } catch (err: any) {
      alert(err.message || 'Social operation failed');
    }
  };

  const handleCompareTaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compareUserId) return;
    setTasteLoading(true);
    setTasteError(null);
    setTasteMatch(null);

    try {
      const res = await apiFetch(`/social/taste/match/${compareUserId}`);
      setTasteMatch(res.data);
    } catch (err: any) {
      setTasteError(err.message || 'Could not find taste statistics for this User ID');
    } finally {
      setTasteLoading(false);
    }
  };

  // Mock colors for Pie Charts
  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#3b82f6'];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <UserIcon className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-sm text-slate-400 mt-2 mb-6">Please log in to your account to view your Letterboxd-style social profile and metrics.</p>
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

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header Profile Card */}
        <div className="bg-slate-950 border border-slate-800/60 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/20 to-slate-900/40 pointer-events-none"></div>
          <div className="absolute top-0 right-0 h-48 w-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
            <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-bold shadow-[0_0_40px_rgba(79,70,229,0.3)] ring-4 ring-slate-900">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">{user?.name || 'CineVerse User'}</h1>
              <p className="text-slate-400 text-sm mb-4">{user?.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-6 text-xs text-slate-300 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-400" /> Member Since Aug 2026</span>
                <span className="flex items-center gap-2"><Film className="h-4 w-4 text-indigo-400" /> {diary.length} Diary Entries</span>
              </div>
            </div>
            {/* Gamification Quick Stats if available */}
            {gamificationStats && (
               <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 flex gap-6 text-center sm:text-left shadow-lg">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Level</span>
                    <span className="text-2xl font-black text-indigo-400">{gamificationStats.level}</span>
                  </div>
                  <div className="w-px bg-slate-800"></div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1">XP</span>
                    <span className="text-2xl font-black text-white">{gamificationStats.xp}</span>
                  </div>
               </div>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800/80 mb-8 overflow-x-auto hide-scrollbar gap-2">
          {[
            { id: 'diary', label: 'Movie Diary', icon: Film },
            { id: 'lists', label: 'My Lists', icon: List },
            { id: 'social', label: 'Follows & Feed', icon: Users },
            { id: 'taste', label: 'Taste Matcher', icon: Heart },
            { id: 'analytics', label: 'Analytics Insights', icon: BarChart2 },
            { id: 'gamification', label: 'Achievements', icon: Award },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-3 px-4 text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap rounded-t-xl ${
                  activeTab === t.id
                    ? 'bg-indigo-600/10 text-indigo-400 border-b-2 border-indigo-500'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/50 border-b-2 border-transparent'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="bg-slate-900/40 border border-slate-900/60 rounded-3xl p-6 backdrop-blur-md">
          {/* DIARY TAB */}
          {activeTab === 'diary' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Film className="h-5 w-5 text-indigo-400" /> My Watch Diary
                </h3>
                {loadingDiary ? (
                  <p className="text-sm text-slate-500">Loading your diary logs...</p>
                ) : diary.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
                    <Film className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Your diary is empty. Start logging movies!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diary.map((entry) => (
                      <div key={entry.id} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:border-slate-700 transition gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-12 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center">
                            <Film className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-100 text-base">{entry.movie.title}</h4>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400 font-medium">
                              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(entry.watchedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'})}</span>
                              {entry.rating && (
                                <span className="flex items-center text-amber-500 font-semibold gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                  <Star className="h-3 w-3 fill-amber-500" /> {entry.rating}
                                </span>
                              )}
                              {entry.isRewatch && (
                                <span className="bg-indigo-950 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-900/50 text-[10px] font-bold tracking-wider">REWATCH</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono sm:text-right hidden sm:block">Logged:<br/>{new Date(entry.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Log Form */}
              <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 h-fit shadow-xl">
                <h3 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-400" /> Log a Movie
                </h3>
                <form onSubmit={handleAddDiary} className="space-y-5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Movie ID (UUID)</label>
                    <input
                      type="text"
                      required
                      value={newDiaryMovieId}
                      onChange={(e) => setNewDiaryMovieId(e.target.value)}
                      placeholder="e.g. movie-uuid-here"
                      className="mt-1.5 w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Rating</label>
                      <select
                        value={newDiaryRating}
                        onChange={(e) => setNewDiaryRating(e.target.value)}
                        className="mt-1.5 w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                      >
                        {['1.0', '2.0', '3.0', '4.0', '5.0'].map((r) => (
                          <option key={r} value={r}>{r} Stars</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Watch Date</label>
                      <input
                        type="date"
                        required
                        value={newDiaryDate}
                        onChange={(e) => setNewDiaryDate(e.target.value)}
                        className="mt-1.5 w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer mt-2 group">
                    <input
                      type="checkbox"
                      checked={newDiaryRewatch}
                      onChange={(e) => setNewDiaryRewatch(e.target.checked)}
                      className="h-4 w-4 accent-indigo-500 rounded border-slate-700 bg-slate-900 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition">Mark as Rewatched</span>
                  </label>

                  <button
                    type="submit"
                    className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    Log to Diary
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* LISTS TAB */}
          {activeTab === 'lists' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-bold text-slate-200">Custom Movie Playlists</h3>
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                  <List className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Create shareable list boards, drag and drop to order film selections, and share your cinematographic rankings.
                  </p>
                </div>
              </div>

              {/* Create List Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-indigo-400" /> Create Custom List
                </h3>
                <form onSubmit={handleCreateList} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500">List Name</label>
                    <input
                      type="text"
                      required
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="e.g. My Favorite Sci-Fi"
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500">Description</label>
                    <textarea
                      value={newListDesc}
                      onChange={(e) => setNewListDesc(e.target.value)}
                      placeholder="Add an optional description"
                      className="mt-1 w-full h-20 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 outline-none resize-none"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={newListPublic}
                      onChange={(e) => setNewListPublic(e.target.checked)}
                      className="accent-indigo-500"
                    />
                    <span className="text-xs text-slate-300">Public visibility</span>
                  </label>

                  <button
                    type="submit"
                    className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Create List
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SOCIAL & ACTIVITY TAB */}
          {activeTab === 'social' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-bold text-slate-200">Community Activity Feed</h3>
                {feed.length === 0 ? (
                  <p className="text-xs text-slate-500">No activity from followed users yet. Start following people!</p>
                ) : (
                  <div className="space-y-4">
                    {feed.map((act) => (
                      <div key={act.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-indigo-400">{act.data.user.name}</span>
                            <span className="text-xs text-slate-400 ml-1.5">
                              {act.type === 'REVIEW' && 'reviewed'}
                              {act.type === 'DIARY' && 'watched'}
                              {act.type === 'LIST' && 'created custom list'}
                            </span>
                            <h4 className="font-bold text-slate-200 mt-1">{act.data.movie?.title || act.data.name}</h4>
                          </div>
                          <span className="text-[10px] text-slate-500">{new Date(act.date).toLocaleDateString()}</span>
                        </div>
                        {act.type === 'REVIEW' && (
                          <p className="text-xs text-slate-400 mt-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                            "{act.data.content}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Follower Stats & Search */}
              <div className="space-y-6">
                {/* Search / Add Friends */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-indigo-400" /> Find Friends
                  </h3>
                  <form onSubmit={handleUserSearch} className="space-y-3">
                    <input
                      type="text"
                      required
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="Enter user's email address"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 outline-none"
                    />
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition">
                      Search User
                    </button>
                  </form>

                  {socialMsg && <p className="text-xs text-red-400 mt-2">{socialMsg}</p>}

                  {searchResult && (
                    <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-300">{searchResult.name}</p>
                        <p className="text-[10px] text-slate-500">{searchResult.email}</p>
                      </div>
                      <button
                        onClick={() => handleFollowToggle(searchResult.id, false)}
                        className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                      >
                        <UserPlus className="h-3 w-3" /> Follow
                      </button>
                    </div>
                  )}
                </div>

                {/* Follow lists */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-400" /> Connections
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-xl font-bold text-slate-200">{followers.length}</span>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Followers</p>
                    </div>
                    <div className="text-center bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-xl font-bold text-slate-200">{following.length}</span>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Following</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TASTE COMPATIBILITY TAB */}
          {activeTab === 'taste' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <Heart className="h-10 w-10 text-rose-500 mx-auto mb-3 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-200">Movie Taste Compatibility</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Compare ratings, genres, and logging behaviors against any other CineVerse user using Cosine and Jaccard distance vectors.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <form onSubmit={handleCompareTaste} className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={compareUserId}
                    onChange={(e) => setCompareUserId(e.target.value)}
                    placeholder="Enter target user ID"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:border-indigo-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={tasteLoading}
                    className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 text-white rounded-xl text-xs font-semibold transition"
                  >
                    {tasteLoading ? 'Calculating...' : 'Compare Taste'}
                  </button>
                </form>

                {tasteError && (
                  <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle className="h-4 w-4" /> {tasteError}
                  </div>
                )}

                {tasteMatch && (
                  <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Taste Compatibility Score</span>
                    
                    {/* Visual Compatibility Gauge */}
                    <div className="mt-4 flex items-center justify-center relative">
                      <div className="h-32 w-32 rounded-full border-4 border-slate-800 flex items-center justify-center">
                        <span className="text-3xl font-extrabold text-indigo-400">{tasteMatch.matchPercentage}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-8">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-500">Overlap Index</span>
                        <p className="text-lg font-bold text-slate-200 mt-1">{tasteMatch.jaccard}</p>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-500">Cosine Similarity</span>
                        <p className="text-lg font-bold text-slate-200 mt-1">{tasteMatch.cosine}</p>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-500">Common Movies</span>
                        <p className="text-lg font-bold text-slate-200 mt-1">{tasteMatch.commonCount}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ANALYTICS INSIGHTS TAB */}
          {activeTab === 'analytics' && (
            <div>
              {loadingAnalytics ? (
                <p className="text-sm text-slate-500">Generating analytics metrics...</p>
              ) : !analytics ? (
                <p className="text-sm text-slate-500">No watch history statistics available yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Stats row */}
                  <div className="md:col-span-2 grid grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Total Watched</span>
                      <p className="text-2xl font-bold mt-1 text-indigo-400">{analytics.stats.totalWatched}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Reviews Logged</span>
                      <p className="text-2xl font-bold mt-1 text-purple-400">{analytics.stats.totalReviewed}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Average Rating</span>
                      <p className="text-2xl font-bold mt-1 text-amber-500">{analytics.stats.avgRating} ★</p>
                    </div>
                  </div>

                  {/* Monthly Activity Area Chart */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                    <h4 className="text-sm font-bold text-slate-200 mb-4">Monthly Watch Activity</h4>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.monthlyActivity}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                          <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Rating Distribution Bar Chart */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                    <h4 className="text-sm font-bold text-slate-200 mb-4">Ratings Distribution</h4>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.ratingDistribution}>
                          <XAxis dataKey="rating" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                          <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Favorite Genres Pie Chart */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl md:col-span-2">
                    <h4 className="text-sm font-bold text-slate-200 mb-4">Genre Preference Share</h4>
                    <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                      <div className="h-56 w-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.favoriteGenres}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="count"
                            >
                              {analytics.favoriteGenres.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-3">
                        {analytics.favoriteGenres.map((entry: any, index: number) => (
                          <div key={entry.name} className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="text-xs font-semibold text-slate-300">{entry.name}</span>
                            <span className="text-xs text-slate-500 font-mono">({entry.count} watched)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GAMIFICATION / ACHIEVEMENTS TAB */}
          {activeTab === 'gamification' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {loadingGamification && !gamificationStats ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent border-indigo-500 mb-3"></div>
                  <p className="text-sm">Loading Achievements & Progression...</p>
                </div>
              ) : !gamificationStats ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Unable to retrieve gamification data. Make sure database defaults are seeded.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Progress Card & Active Challenges */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Level & XP Overview */}
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-900/30 rounded-3xl p-6 relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                      <div className="flex items-center gap-5 relative">
                        <div className="h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-3xl font-extrabold text-indigo-400 shadow-inner">
                          {gamificationStats.level}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-slate-100">Level {gamificationStats.level} Cinephile</h4>
                          <div className="flex justify-between items-center text-xs text-slate-400 mt-2 font-mono">
                            <span>{gamificationStats.xp} / {gamificationStats.nextLevelXp} XP</span>
                            <span>{Math.max(0, gamificationStats.nextLevelXp - gamificationStats.xp)} XP to Level {gamificationStats.level + 1}</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden mt-2 border border-slate-700/50">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, (gamificationStats.xp / gamificationStats.nextLevelXp) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Challenges */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" /> Active Curation Challenges
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gamificationStats.challenges.map((c: any) => {
                          const percent = Math.min(100, (c.currentProgress / c.targetValue) * 100);
                          return (
                            <div key={c.challengeId} className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/30 transition flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h5 className="font-bold text-sm text-slate-200">{c.name}</h5>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                    c.isCompleted 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  }`}>
                                    {c.isCompleted ? 'Completed' : `+${c.rewardXp} XP`}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{c.description}</p>
                              </div>
                              <div className="mt-4">
                                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-1">
                                  <span>Progress</span>
                                  <span>{c.currentProgress} / {c.targetValue}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      c.isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Unlocked Badges */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <Award className="h-5 w-5 text-indigo-400" /> Badge Collection ({gamificationStats.badges.length})
                      </h4>
                      {gamificationStats.badges.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl">
                          <Award className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">No badges unlocked yet. Book movies, rate audio quality, or write reviews to start earning!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {gamificationStats.badges.map((b: any) => (
                            <div key={b.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center text-center hover:border-slate-700 transition relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <div className="text-3xl mb-2">{b.icon || '🏅'}</div>
                              <h5 className="font-bold text-xs text-slate-200 truncate w-full">{b.name}</h5>
                              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{b.description}</p>
                              <span className="text-[9px] text-slate-500 font-mono mt-3 uppercase">Unlocked {new Date(b.unlockedAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Leaderboards */}
                  <div className="space-y-6">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Leaderboard</h4>
                        <div className="flex rounded-lg bg-slate-850 p-1 border border-slate-850">
                          {(['global', 'friends'] as const).map((scope) => (
                            <button
                              key={scope}
                              onClick={() => setLeaderboardScope(scope)}
                              className={`text-[10px] px-3 py-1.5 rounded-md font-semibold capitalize transition ${
                                leaderboardScope === scope 
                                  ? 'bg-indigo-600 text-white shadow-md' 
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {scope}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {leaderboard.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-6">No entries available.</p>
                        ) : (
                          leaderboard.map((player, index) => {
                            const isSelf = player.userId === user?.id;
                            let rankBadge = `${index + 1}`;
                            if (index === 0) rankBadge = '🥇';
                            else if (index === 1) rankBadge = '🥈';
                            else if (index === 2) rankBadge = '🥉';

                            return (
                              <div 
                                key={player.userId}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                                  isSelf 
                                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-inner' 
                                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-800'
                                }`}
                              >
                                <div className="w-6 text-center text-xs font-bold text-slate-400 font-mono">
                                  {rankBadge}
                                </div>
                                <div className="h-8 w-8 rounded-full bg-slate-850 flex items-center justify-center font-bold text-xs text-indigo-400 border border-slate-800">
                                  {player.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-xs text-slate-200 truncate">
                                    {player.name} {isSelf && <span className="text-[9px] text-indigo-400 font-mono font-bold">(You)</span>}
                                  </h5>
                                  <p className="text-[10px] text-slate-500 font-mono">Level {player.level}</p>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-xs text-slate-100 font-mono">{player.xp}</span>
                                  <span className="text-[9px] text-slate-500 font-mono block">XP</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
