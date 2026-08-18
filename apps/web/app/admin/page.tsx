'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { apiFetch } from '../../lib/api';
import {
  Users, Film, Building2, MessageSquare, BarChart2,
  Shield, Trash2, UserCheck, ChevronRight, TrendingUp,
  IndianRupee, Ticket, AlertTriangle, FileText,
} from 'lucide-react';

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'theatres', label: 'Theatres', icon: Building2 },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
];

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('analytics');

  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [theatres, setTheatres] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    fetchTabData(activeTab);
  }, [activeTab, isAuthenticated]);

  const fetchTabData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'analytics') {
        const res = await apiFetch('/admin/analytics');
        setAnalytics(res.data);
      } else if (tab === 'users') {
        const res = await apiFetch(`/admin/users?search=${search}`);
        setUsers(res.data.users || []);
      } else if (tab === 'theatres') {
        const res = await apiFetch('/admin/theatres');
        setTheatres(res.data.theatres || []);
      } else if (tab === 'movies') {
        const res = await apiFetch('/admin/movies');
        setMovies(res.data.movies || []);
      } else if (tab === 'reviews') {
        const res = await apiFetch('/admin/reviews');
        setReviews(res.data.reviews || []);
      } else if (tab === 'audit') {
        const res = await apiFetch('/admin/audit-logs');
        setAuditLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      await apiFetch(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
      fetchTabData('users');
    } catch {}
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      fetchTabData('users');
    } catch {}
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await apiFetch(`/admin/reviews/${reviewId}`, { method: 'DELETE' });
      fetchTabData('reviews');
    } catch {}
  };

  const updateMovieStatus = async (movieId: string, status: string) => {
    try {
      await apiFetch(`/admin/movies/${movieId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      fetchTabData('movies');
    } catch {}
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <Shield className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-sm text-slate-400 mt-2">Admin or Super Admin role required.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 gap-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 space-y-2">
          <h2 className="text-[10px] uppercase font-black text-slate-500 tracking-widest px-3 mb-6">Admin Console</h2>
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === t.id
                    ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-8 min-w-0">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent border-indigo-500" />
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && analytics && !loading && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-3xl font-black text-white">Platform Analytics</h2>
                <p className="text-sm text-slate-400 mt-1">High-level metrics across the CineVerse platform.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'indigo' },
                  { label: 'Total Bookings', value: analytics.totalBookings, icon: Ticket, color: 'purple' },
                  { label: 'Total Revenue', value: `₹${analytics.totalRevenue?.toLocaleString()}`, icon: IndianRupee, color: 'emerald' },
                  { label: 'Cancellation Rate', value: analytics.cancellationRate, icon: AlertTriangle, color: 'amber' },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 shadow-sm hover:border-slate-700 transition">
                      <div className={`h-12 w-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center mb-4`}>
                        <Icon className={`h-6 w-6 text-${stat.color}-400`} />
                      </div>
                      <p className="text-3xl font-black text-white">{stat.value}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Confirmed Bookings</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">{analytics.confirmedBookings}</p>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <p className="text-xs text-slate-500 uppercase font-bold">Cancelled Bookings</p>
                  <p className="text-xl font-bold text-rose-400 mt-1">{analytics.cancelledBookings}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <p className="text-xs text-slate-500 uppercase font-bold">Total Theatres</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">{analytics.totalTheatres}</p>
                </div>
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && !loading && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white">User Management</h2>
                  <p className="text-sm text-slate-400 mt-1">Manage platform access and roles.</p>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchTabData('users')}
                    placeholder="Search by name/email..."
                    className="w-full sm:w-80 bg-slate-900/60 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                  <Users className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                      <th className="text-left px-6 py-4">User</th>
                      <th className="text-left px-6 py-4">Role</th>
                      <th className="text-left px-6 py-4">Level</th>
                      <th className="text-left px-6 py-4">Bookings</th>
                      <th className="text-left px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-800/20 transition">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-200">{u.name || '—'}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none"
                          >
                            {['USER', 'THEATRE_OWNER', 'ADMIN', 'SUPER_ADMIN'].map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-indigo-400">Lv.{u.level}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{u._count?.bookings}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="text-rose-400 hover:text-rose-300 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* THEATRES */}
          {activeTab === 'theatres' && !loading && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold">Theatre Management</h2>
              <div className="grid grid-cols-1 gap-4">
                {theatres.map((t: any) => (
                  <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-200">{t.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{t.city?.name} · {t.address}</p>
                      <p className="text-xs text-slate-500 mt-1">Owner: {t.owner?.name || t.owner?.email} · {t._count?.screens} screens</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MOVIES */}
          {activeTab === 'movies' && !loading && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold">Movie Management</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase font-bold">
                      <th className="text-left px-4 py-3">Title</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Rating</th>
                      <th className="text-left px-4 py-3">Reviews</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {movies.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-semibold text-slate-200">{m.title}</td>
                        <td className="px-4 py-3">
                          <select
                            value={m.status}
                            onChange={(e) => updateMovieStatus(m.id, e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none"
                          >
                            {['NOW_SHOWING', 'UPCOMING', 'ARCHIVED'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-amber-400 font-bold">{m.rating?.toFixed(1)} ★</td>
                        <td className="px-4 py-3 text-slate-400">{m._count?.reviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REVIEWS */}
          {activeTab === 'reviews' && !loading && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold">Review Moderation</h2>
              <div className="space-y-3">
                {reviews.map((r: any) => (
                  <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-200">{r.user?.name || r.user?.email}</span>
                        <span className="text-xs text-slate-500">on</span>
                        <span className="font-semibold text-xs text-indigo-400">{r.movie?.title}</span>
                        <span className="text-amber-400 text-xs font-bold">{r.rating} ★</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{r.content}</p>
                    </div>
                    <button
                      onClick={() => deleteReview(r.id)}
                      className="text-rose-400 hover:text-rose-300 shrink-0 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AUDIT LOGS */}
          {activeTab === 'audit' && !loading && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold">Audit Logs</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase">
                      <th className="text-left px-4 py-3">Timestamp</th>
                      <th className="text-left px-4 py-3">Action</th>
                      <th className="text-left px-4 py-3">Resource</th>
                      <th className="text-left px-4 py-3">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-800/20">
                        <td className="px-4 py-3 text-slate-500 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-amber-400">{log.action}</td>
                        <td className="px-4 py-3 text-slate-300">{log.resource} {log.resourceId ? `#${log.resourceId.slice(0, 8)}` : ''}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">{log.ipAddress || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
