'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { apiFetch } from '../../lib/api';
import { 
  Users, Plus, Mail, Vote, Film, Ticket, Calendar, ShieldCheck, Armchair, HelpCircle, DollarSign, RefreshCw, LogOut, ArrowRight, UserPlus
} from 'lucide-react';
import Link from 'next/link';

export default function WatchPartyPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activePartyId, setActivePartyId] = useState<string | null>(null);
  const [party, setParty] = useState<any>(null);
  const [loadingParty, setLoadingParty] = useState(false);

  // Creation State
  const [newPartyName, setNewPartyName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Vote Suggest State
  const [suggestMovieId, setSuggestMovieId] = useState('');
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [votes, setVotes] = useState<any[]>([]);

  // Show selection State
  const [targetShowId, setTargetShowId] = useState('');
  const [showSelectLoading, setShowSelectLoading] = useState(false);

  // Adjacent Seats solver State
  const [solvingSeats, setSolvingSeats] = useState(false);
  const [solvedSeats, setSolvedSeats] = useState<any[]>([]);
  const [solveError, setSolveError] = useState<string | null>(null);

  // Split booking State
  const [splitBooking, setSplitBooking] = useState<any>(null);
  const [initiatingSplit, setInitiatingSplit] = useState(false);
  const [splitPaymentStatus, setSplitPaymentStatus] = useState<any>(null);
  const [simulatingPayId, setSimulatingPayId] = useState<string | null>(null);

  // Fetch active party details
  useEffect(() => {
    if (activePartyId) {
      fetchPartyDetails();
    }
  }, [activePartyId]);

  const fetchPartyDetails = async () => {
    setLoadingParty(true);
    try {
      const res = await apiFetch(`/watchparty/${activePartyId}`);
      setParty(res.data);

      const votesRes = await apiFetch(`/watchparty/${activePartyId}/votes`);
      setVotes(votesRes.data);

      if (res.data.showId) {
        setTargetShowId(res.data.showId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingParty(false);
    }
  };

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName) return;
    setCreateLoading(true);

    try {
      const res = await apiFetch('/watchparty', {
        method: 'POST',
        body: JSON.stringify({ name: newPartyName }),
      });
      setActivePartyId(res.data.id);
      setNewPartyName('');
    } catch (err: any) {
      alert(err.message || 'Failed to create watch party');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !activePartyId) return;
    setInviteLoading(true);

    try {
      await apiFetch(`/watchparty/${activePartyId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail }),
      });
      setInviteEmail('');
      fetchPartyDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to invite user');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSuggestMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestMovieId || !activePartyId) return;
    setSuggestLoading(true);

    try {
      await apiFetch(`/watchparty/${activePartyId}/suggest`, {
        method: 'POST',
        body: JSON.stringify({ movieId: suggestMovieId }),
      });
      setSuggestMovieId('');
      fetchPartyDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to suggest movie');
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleVoteToggle = async (movieId: string) => {
    if (!activePartyId) return;
    try {
      await apiFetch(`/watchparty/${activePartyId}/suggest`, {
        method: 'POST',
        body: JSON.stringify({ movieId }),
      });
      fetchPartyDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle vote');
    }
  };

  const handleSelectShow = async () => {
    if (!activePartyId || !targetShowId) return;
    setShowSelectLoading(true);

    try {
      await apiFetch(`/watchparty/${activePartyId}/select-show`, {
        method: 'POST',
        body: JSON.stringify({ showId: targetShowId }),
      });
      fetchPartyDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to lock movie showtime');
    } finally {
      setShowSelectLoading(false);
    }
  };

  const handleSolveAdjacentSeats = async () => {
    if (!party?.showId) return;
    setSolvingSeats(true);
    setSolveError(null);
    setSolvedSeats([]);

    try {
      const memberCount = party.members.length;
      const res = await apiFetch(`/watchparty/seats/adjacent?showId=${party.showId}&seatCount=${memberCount}`);
      setSolvedSeats(res.data);
    } catch (err: any) {
      setSolveError(err.message || 'Could not find adjacent seat blocks for the group size.');
    } finally {
      setSolvingSeats(false);
    }
  };

  const handleInitiateSplitPayment = async () => {
    if (!party || !party.showId || solvedSeats.length === 0) return;
    setInitiatingSplit(true);

    try {
      const showId = party.showId;
      const seatIds = solvedSeats.map((s) => s.seatId);
      
      // Calculate equal split shares
      const showRes = await apiFetch(`/watchparty/${party.id}`);
      // In production we query show price. Standard showseat price standard
      const showPrice = party.show?.priceStandard || 250;
      const totalAmount = showPrice * party.members.length;
      const shareAmount = totalAmount / party.members.length;

      const shares = party.members.map((m: any) => ({
        userId: m.userId,
        amount: shareAmount,
      }));

      const res = await apiFetch('/watchparty/booking/split', {
        method: 'POST',
        body: JSON.stringify({
          partyId: party.id,
          showId,
          seatIds,
          shares,
        }),
      });

      setSplitBooking(res.data);
      setSplitPaymentStatus(res.data.splitPayment);
    } catch (err: any) {
      alert(err.message || 'Failed to initialize split booking transaction');
    } finally {
      setInitiatingSplit(false);
    }
  };

  const handleSimulatePayment = async (memberUserId: string) => {
    if (!splitPaymentStatus) return;
    setSimulatingPayId(memberUserId);

    try {
      const res = await apiFetch(`/watchparty/booking/split/${splitPaymentStatus.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          paymentId: `pay_group_mock_${Math.random().toString(36).substring(2, 9)}`,
        }),
      });
      setSplitPaymentStatus(res.data);
      
      // Check if completely paid
      if (res.data.status === 'PAID') {
        alert('All members paid! Group booking is fully confirmed!');
        // Refresh party details
        fetchPartyDetails();
      }
    } catch (err: any) {
      alert(err.message || 'Simulated payment failed');
    } finally {
      setSimulatingPayId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <PageShell>
        <div className="cv-container cv-page">
          <EmptyState
            title="Sign in for watch parties"
            description="Invite friends, vote on a film, and split the bill."
            action={<Link href="/login"><Button size="sm">Sign in</Button></Link>}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="cv-container cv-page">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Party Selection & Create */}
          <div className="space-y-6">
            <div className="border border-[var(--border)] rounded-[8px] p-5">
              <h2 className="text-[16px] font-semibold mb-4">Watch parties</h2>
              
              {/* Form to create party */}
              <form onSubmit={handleCreateParty} className="space-y-3 mb-6">
                <input
                  type="text"
                  required
                  placeholder="New party name"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  className="w-full bg-surface border border-[var(--border)] rounded-[6px] px-3 py-2 text-[13px] outline-none"
                />
                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full py-2 bg-primary hover:bg-primary-hover text-white rounded-[6px] text-[13px] font-semibold flex items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Create Party
                </button>
              </form>

              {/* List of active parties */}
              <div className="space-y-2">
                {activePartyId ? (
                  <button
                    onClick={() => {
                      setActivePartyId(null);
                      setParty(null);
                      setVotes([]);
                      setSolvedSeats([]);
                      setSplitBooking(null);
                      setSplitPaymentStatus(null);
                    }}
                    className="w-full py-2.5 px-4 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-between"
                  >
                    <span>Back to list</span>
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">Create or join a party to start voting on movie shows.</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Party Dashboard details panel */}
          <div className="lg:col-span-2 space-y-6">
            {!activePartyId ? (
              <div className="bg-slate-900/30 border border-dashed border-slate-850 rounded-[8px] p-12 text-center h-full flex flex-col items-center justify-center">
                <Users className="h-12 w-12 text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-300">No Active Party Selected</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  Select a watch party from the sidebar menu, or create a brand new one to suggest films, calculate adjacent seat coordinates, and split billing with friends.
                </p>
              </div>
            ) : loadingParty && !party ? (
              <div className="bg-slate-900 border border-slate-800 rounded-[8px] p-12 text-center">
                <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Loading party room state...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Party Details Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-[8px] p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-600/5 rounded-full blur-3xl"></div>
                  <div className="flex justify-between items-start relative">
                    <div>
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Party Active Room</span>
                      <h1 className="text-xl font-bold mt-1 text-slate-100">{party?.name}</h1>
                      <p className="text-xs text-slate-400 mt-1">Status: <span className="text-indigo-400 font-semibold uppercase">{party?.status}</span></p>
                    </div>
                    <button onClick={fetchPartyDetails} className="p-2 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                      <RefreshCw className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Member Invite & List */}
                  <div className="mt-6 pt-6 border-t border-slate-800/80">
                    <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-400" /> Room Members ({party?.members.length})
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {party?.members.map((m: any) => (
                        <div key={m.id} className="bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-indigo-600 text-[10px] font-bold flex items-center justify-center">
                            {m.user.name ? m.user.name[0].toUpperCase() : 'U'}
                          </div>
                          <span className="text-slate-300 font-semibold">{m.user.name || m.user.email}</span>
                          {party?.hostId === m.userId && <span className="text-[9px] text-amber-500 font-bold uppercase">Host</span>}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleInvite} className="flex gap-2 max-w-md">
                      <input
                        type="email"
                        required
                        placeholder="Invite friend by email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs focus:border-indigo-500 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={inviteLoading}
                        className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1"
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Invite
                      </button>
                    </form>
                  </div>
                </div>

                {/* Movie suggestion & voting segment */}
                {party?.status === 'VOTING' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-[8px] p-6">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                      <Vote className="h-5 w-5 text-indigo-400" /> Suggested Movie Candidates
                    </h3>

                    <form onSubmit={handleSuggestMovie} className="flex gap-2 mb-6">
                      <input
                        type="text"
                        required
                        placeholder="Suggest movie ID (e.g. movie-uuid-here)"
                        value={suggestMovieId}
                        onChange={(e) => setSuggestMovieId(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={suggestLoading}
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                      >
                        Suggest
                      </button>
                    </form>

                    <div className="space-y-3">
                      {votes.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No movies suggested yet. Suggest a candidate above!</p>
                      ) : (
                        votes.map((v: any) => (
                          <div key={v.movie.id} className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center justify-between hover:border-slate-800 transition">
                            <div>
                              <h4 className="font-bold text-slate-200 text-xs">{v.movie.title}</h4>
                              <p className="text-[10px] text-slate-500 mt-1">Votes: {v.count} ({v.voters.join(', ')})</p>
                            </div>
                            <button
                              onClick={() => handleVoteToggle(v.movie.id)}
                              className="py-1 px-3 bg-indigo-950 hover:bg-indigo-900 border border-indigo-900/50 text-indigo-400 rounded-lg text-[10px] font-bold transition"
                            >
                              Vote
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Host action to close voting and lock showtime */}
                    {party?.hostId === user?.id && votes.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-slate-850 space-y-4">
                        <h4 className="text-xs font-bold text-slate-200">Host Actions: Close Voting & Select Show</h4>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter Show ID to proceed"
                            value={targetShowId}
                            onChange={(e) => setTargetShowId(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:border-indigo-500 outline-none"
                          />
                          <button
                            onClick={handleSelectShow}
                            disabled={showSelectLoading || !targetShowId}
                            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                          >
                            Lock Show
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Booking & seats coordination segment */}
                {party?.status === 'BOOKING' && (
                  <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-[8px] p-6">
                      <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Armchair className="h-5 w-5 text-indigo-400" /> Contiguous Seat Allocator
                      </h3>
                      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                        CineVerse's seat allocator will automatically search the screen database for {party.members.length} adjacent seats (consecutive seat numbers in the same row) to ensure your group sits together.
                      </p>

                      <div className="flex gap-3 mb-6">
                        <button
                          onClick={handleSolveAdjacentSeats}
                          disabled={solvingSeats}
                          className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          {solvingSeats ? 'Solving Layout...' : 'Search Consequent Seats'}
                        </button>
                      </div>

                      {solveError && (
                        <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-xs">
                          {solveError}
                        </div>
                      )}

                      {solvedSeats.length > 0 && (
                        <div className="space-y-4">
                          <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Allocated Seat Blocks</span>
                            <div className="flex gap-2 mt-2">
                              {solvedSeats.map((s) => (
                                <div key={s.showSeatId} className="bg-indigo-950 text-indigo-400 border border-indigo-900/50 rounded-lg px-3 py-2 text-center text-xs font-extrabold min-w-12">
                                  {s.row}{s.number}
                                  <span className="block text-[8px] text-slate-500 font-semibold uppercase mt-0.5">{s.type}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Initiate Split Checkout */}
                          {!splitBooking && (
                            <button
                              onClick={handleInitiateSplitPayment}
                              disabled={initiatingSplit}
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
                            >
                              Initialize Group Split Checkout <ArrowRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Split checkout payment list */}
                    {splitPaymentStatus && (
                      <div className="bg-slate-900 border border-slate-800 rounded-[8px] p-6">
                        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-indigo-400" /> Split Billing Checklist (15 min Lock)
                        </h3>

                        <div className="space-y-3">
                          {splitPaymentStatus.members.map((m: any) => (
                            <div key={m.userId} className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-slate-300">User Share: {m.userId.substring(0, 8)}...</span>
                                <p className="text-xs font-mono text-indigo-400 mt-1">₹{m.amount.toFixed(2)}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                                  m.status === 'PAID'
                                    ? 'bg-emerald-950 text-emerald-400 border-emerald-900/50'
                                    : 'bg-amber-950 text-amber-400 border-amber-900/50'
                                }`}>
                                  {m.status}
                                </span>
                                
                                {m.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleSimulatePayment(m.userId)}
                                    disabled={simulatingPayId !== null}
                                    className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold transition"
                                  >
                                    {simulatingPayId === m.userId ? 'Paying...' : 'Simulate Pay'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
