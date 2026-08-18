'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import Navbar from '../../components/Navbar';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { apiFetch } from '../../lib/api';
import {
  Building2, Monitor, Calendar, Ticket, BarChart2,
  IndianRupee, TrendingUp, Users, Lock, Shield,
} from 'lucide-react';

const TABS = [
  { id: 'analytics', label: 'Revenue & Analytics', icon: BarChart2 },
  { id: 'theatres', label: 'My Theatres', icon: Building2 },
  { id: 'shows', label: 'Shows', icon: Calendar },
  { id: 'bookings', label: 'Bookings', icon: Ticket },
];

export default function TheatreOwnerPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [theatres, setTheatres] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isOwner = user?.role === 'THEATRE_OWNER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isAuthenticated || !isOwner) return;
    fetchTabData(activeTab);
  }, [activeTab, isAuthenticated]);

  const fetchTabData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'analytics') {
        const res = await apiFetch('/owner/analytics');
        setAnalytics(res.data);
      } else if (tab === 'theatres') {
        const res = await apiFetch('/owner/theatres');
        setTheatres(res.data || []);
      } else if (tab === 'shows') {
        const res = await apiFetch('/owner/shows');
        setShows(res.data?.shows || []);
      } else if (tab === 'bookings') {
        const res = await apiFetch('/owner/bookings');
        setBookings(res.data?.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !isOwner) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <Lock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Theatre Owner Access Only</h2>
            <p className="text-sm text-slate-400 mt-2">Contact an admin to be upgraded to Theatre Owner role.</p>
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
          <h2 className="text-[10px] uppercase font-black text-slate-500 tracking-widest px-3 mb-6">Owner Console</h2>
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === t.id
                    ? 'bg-amber-500 shadow-lg shadow-amber-500/20 text-white'
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
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent border-amber-500" />
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && analytics && !loading && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-3xl font-black text-white">Revenue & Occupancy</h2>
                <p className="text-sm text-slate-400 mt-1">High-level metrics for your theatres.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'Total Revenue', value: `₹${analytics.totalRevenue?.toLocaleString() || 0}`, icon: IndianRupee, color: 'emerald' },
                  { label: 'Total Bookings', value: analytics.totalBookings, icon: Ticket, color: 'indigo' },
                  { label: 'Occupancy Rate', value: analytics.occupancyRate, icon: TrendingUp, color: 'amber' },
                  { label: 'Total Seats', value: analytics.totalShowSeats, icon: Users, color: 'purple' },
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

              {/* Monthly Revenue Table */}
              {analytics.monthlyRevenue?.length > 0 && (
                <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-800">
                    <h3 className="font-bold text-slate-200">Monthly Revenue Breakdown</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase font-bold">
                        <th className="text-left px-5 py-3">Month</th>
                        <th className="text-right px-5 py-3">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {analytics.monthlyRevenue.map((m: any) => (
                        <tr key={m.month} className="hover:bg-slate-800/20">
                          <td className="px-5 py-3 text-slate-300 font-mono">{m.month}</td>
                          <td className="px-5 py-3 text-right text-emerald-400 font-bold">
                            ₹{m.revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* THEATRES */}
          {activeTab === 'theatres' && !loading && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold">My Theatres</h2>
              {theatres.length === 0 ? (
                <div className="text-center py-12 bg-slate-900 border border-dashed border-slate-800 rounded-2xl">
                  <Building2 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No theatres found. Contact an admin to add a theatre.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {theatres.map((t: any) => (
                    <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-2">
                      <h3 className="font-bold text-lg text-slate-200">{t.name}</h3>
                      <p className="text-sm text-slate-400">{t.city?.name} · {t.address}</p>
                      <p className="text-xs text-amber-400 font-bold">{t._count?.screens} screens configured</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SHOWS */}
          {activeTab === 'shows' && !loading && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold">Upcoming Shows</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase font-bold">
                      <th className="text-left px-4 py-3">Movie</th>
                      <th className="text-left px-4 py-3">Theatre · Screen</th>
                      <th className="text-left px-4 py-3">Showtime</th>
                      <th className="text-left px-4 py-3">Bookings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {shows.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-semibold text-slate-200">{s.movie?.title}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {s.screen?.theatre?.name} · {s.screen?.name}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                          {new Date(s.startTime).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-indigo-400 font-bold">{s._count?.bookings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BOOKINGS */}
          {activeTab === 'bookings' && !loading && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold">Bookings</h2>
              <div className="space-y-3">
                {bookings.map((b: any) => (
                  <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-200">{b.show?.movie?.title}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {b.show?.screen?.theatre?.name} · {b.show?.screen?.name} ·{' '}
                          {b.show?.startTime && new Date(b.show.startTime).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Customer: {b.user?.name || b.user?.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">₹{b.totalAmount?.toLocaleString()}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                          b.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400' :
                          b.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {b.showSeats?.map((ss: any) => (
                        <span key={ss.id} className="text-[10px] bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-400 font-mono">
                          {ss.seat?.row}{ss.seat?.number} ({ss.seat?.type})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
