'use client';

import { useState, useEffect, use } from 'react';
import Navbar from '../../../components/Navbar';
import { apiFetch } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { Armchair, Sparkles, AlertCircle, ShoppingBag, Clock, ShieldCheck, Calendar } from 'lucide-react';
import Link from 'next/link';
import { socket } from '../../../lib/socket';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/authStore';

export default function ShowSeatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: showId } = use(params);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [show, setShow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]); // Array of seat objects
  const [error, setError] = useState<string | null>(null);

  const [isLocking, setIsLocking] = useState(false);

  const fetchShowDetails = async () => {
    try {
      const response = await apiFetch(`/theatres/shows/${showId}`);
      setShow(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load show seats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShowDetails();
  }, [showId]);

  // Connect to Socket.IO and listen to live updates
  useEffect(() => {
    if (!showId) return;

    socket.connect();
    socket.emit('joinShowRoom', { showId });

    const handleSeatsLocked = (data: { showId: string; seatIds: string[]; userId: string }) => {
      if (data.showId !== showId) return;
      
      setShow((prevShow: any) => {
        if (!prevShow) return prevShow;
        const updatedSeats = prevShow.showSeats.map((ss: any) => {
          if (data.seatIds.includes(ss.id)) {
            return {
              ...ss,
              status: 'LOCKED',
              lockedById: data.userId,
            };
          }
          return ss;
        });
        return { ...prevShow, showSeats: updatedSeats };
      });
    };

    const handleSeatsUnlocked = (data: { showId: string; seatIds: string[] }) => {
      if (data.showId !== showId) return;

      setShow((prevShow: any) => {
        if (!prevShow) return prevShow;
        const updatedSeats = prevShow.showSeats.map((ss: any) => {
          if (data.seatIds.includes(ss.id)) {
            return {
              ...ss,
              status: 'AVAILABLE',
              lockedById: null,
            };
          }
          return ss;
        });
        return { ...prevShow, showSeats: updatedSeats };
      });

      // Also remove them from user's selection if they were selected and got unlocked by worker
      setSelectedSeats((prevSelected) =>
        prevSelected.filter((s) => !data.seatIds.includes(s.id))
      );
    };

    socket.on('seatsLocked', handleSeatsLocked);
    socket.on('seatsUnlocked', handleSeatsUnlocked);

    return () => {
      socket.emit('leaveShowRoom', { showId });
      socket.off('seatsLocked', handleSeatsLocked);
      socket.off('seatsUnlocked', handleSeatsUnlocked);
      socket.disconnect();
    };
  }, [showId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05050A] text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-4 text-center">
            <Armchair className="h-12 w-12 text-indigo-500 animate-bounce mx-auto" />
            <p className="text-slate-400 text-sm font-medium">Loading seating layout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-[#05050A] text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-red-500/20 bg-[#0A0A12] p-8 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Error Loading Seating Plan</h3>
            <p className="text-sm text-slate-400 mb-6">{error || 'Show details not found.'}</p>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">Back to Movies</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Group seats by row for easier rendering
  const seatsByRow: Record<string, any[]> = {};
  show.showSeats.forEach((showSeat: any) => {
    const row = showSeat.seat.row;
    if (!seatsByRow[row]) {
      seatsByRow[row] = [];
    }
    seatsByRow[row].push(showSeat);
  });

  // Sort seats in each row by number
  Object.keys(seatsByRow).forEach((row) => {
    seatsByRow[row]?.sort((a, b) => a.seat.number - b.seat.number);
  });

  const rows = Object.keys(seatsByRow).sort();

  const handleSeatClick = (showSeat: any) => {
    if (showSeat.status !== 'AVAILABLE') return; // Cannot select booked/locked seats

    const isAlreadySelected = selectedSeats.some((s) => s.id === showSeat.id);
    if (isAlreadySelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== showSeat.id));
    } else {
      // Limit to maximum 10 seats per booking
      if (selectedSeats.length >= 10) {
        alert('You can select a maximum of 10 seats per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, showSeat]);
    }
  };

  const getSeatPrice = (type: string) => {
    switch (type) {
      case 'PREMIUM':
        return show.pricePremium;
      case 'RECLINER':
        return show.priceRecliner;
      case 'STANDARD':
      default:
        return show.priceStandard;
    }
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => {
    return sum + getSeatPrice(seat.seat.type);
  }, 0);

  const getSeatColorClass = (showSeat: any) => {
    const isSelected = selectedSeats.some((s) => s.id === showSeat.id);
    if (isSelected) {
      return 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-110 z-10';
    }

    switch (showSeat.status) {
      case 'BOOKED':
        return 'bg-[#1E1E2E] text-[#1E1E2E] border-[#1E1E2E] cursor-not-allowed opacity-40';
      case 'LOCKED':
        return 'bg-amber-500/20 text-amber-500/50 border-amber-500/30 cursor-not-allowed opacity-80';
      case 'AVAILABLE':
      default:
        // Color based on type
        switch (showSeat.seat.type) {
          case 'RECLINER':
            return 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/20';
          case 'PREMIUM':
            return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-500/20';
          case 'STANDARD':
          default:
            return 'bg-[#0A0A12] text-slate-300 border-[#1E1E2E] hover:border-slate-500 hover:bg-[#1E1E2E]';
        }
    }
  };

  const handleProceedToLock = async () => {
    if (selectedSeats.length === 0 || isLocking) return;
    
    if (!isAuthenticated) {
      router.push(`/login?redirect=/shows/${showId}`);
      return;
    }
    
    setIsLocking(true);
    try {
      const seatIds = selectedSeats.map((s) => s.id);
      
      // Request temporary locks on the selected seats
      await apiFetch('/bookings/lock', {
        method: 'POST',
        body: JSON.stringify({
          showId,
          seatIds,
        }),
      });

      // If locks are secured successfully, redirect to checkout
      const seatIdsStr = seatIds.join(',');
      router.push(`/checkout?showId=${showId}&seats=${seatIdsStr}`);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'Session expired') {
        router.push(`/login?redirect=/shows/${showId}`);
        return;
      }
      alert(err.message || 'Failed to lock seats. Some seats might have been taken.');
      
      // Refresh the seat layout to reflect correct state
      fetchShowDetails();
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] text-slate-100 flex flex-col pb-40 font-sans">
      <Navbar />

      {/* Show header details */}
      <header className="border-b border-[#1E1E2E] bg-[#0A0A12] pt-24 pb-8 px-4 sm:px-6 lg:px-8 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-2 bg-indigo-500/10 w-fit px-3 py-1 rounded-full border border-indigo-500/20">
              <Sparkles className="h-3 w-3" />
              {show.screen.theatre.name} • {show.screen.name}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{show.movie.title}</h1>
            <p className="text-sm text-slate-400 mt-2 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              {new Date(show.startTime).toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}{' '}
              <Clock className="w-4 h-4 text-slate-500 ml-2" />
              {new Date(show.startTime).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-[#1E1E2E] bg-[#05050A] px-5 py-3 text-center min-w-[110px] shadow-sm">
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Standard</span>
              <span className="text-lg font-black text-white">₹{show.priceStandard}</span>
            </div>
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-3 text-center min-w-[110px] shadow-sm">
              <span className="block text-[10px] text-indigo-400/80 uppercase tracking-widest font-bold mb-1">Premium</span>
              <span className="text-lg font-black text-indigo-400">₹{show.pricePremium}</span>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 px-5 py-3 text-center min-w-[110px] shadow-sm">
              <span className="block text-[10px] text-purple-400/80 uppercase tracking-widest font-bold mb-1">Recliner</span>
              <span className="text-lg font-black text-purple-400">₹{show.priceRecliner}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Map Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex flex-col items-center">
        
        {/* Curved Screen Representation */}
        <div className="w-full max-w-3xl mx-auto text-center mb-20 relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-[30px] rounded-[100%] h-24 -top-8 -z-10 opacity-60"></div>
          <svg className="w-full h-12 text-indigo-500/30 overflow-visible pointer-events-none drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <path d="M 0 40 Q 380 -20 760 40" fill="none" stroke="currentColor" strokeWidth="4" className="w-full" />
            <path d="M 0 40 Q 380 -20 760 40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="w-full text-indigo-300" opacity="0.5" />
          </svg>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-300/50">
            CINEMATIC SCREEN
          </span>
        </div>

        {/* Seat Layout */}
        <div className="w-full overflow-x-auto pb-8 flex flex-col items-center touch-pan-x scrollbar-hide">
          <div className="min-w-fit space-y-4 px-4 pb-4">
            {rows.map((row) => (
              <div key={row} className="flex items-center gap-6 group">
                {/* Row Label (Left) */}
                <span className="w-8 text-sm font-bold text-slate-600 text-center group-hover:text-indigo-400 transition-colors">{row}</span>

                {/* Seats row */}
                <div className="flex gap-2.5">
                  {(seatsByRow[row] || []).map((showSeat) => {
                    const isSelected = selectedSeats.some((s) => s.id === showSeat.id);
                    
                    return (
                      <button
                        key={showSeat.id}
                        onClick={() => handleSeatClick(showSeat)}
                        disabled={showSeat.status !== 'AVAILABLE'}
                        className={`
                          relative h-10 w-10 sm:h-11 sm:w-11 rounded-t-xl rounded-b-md border-t-4 border-l border-r border-b text-center text-[11px] font-bold transition-all duration-200 flex items-center justify-center select-none overflow-hidden
                          ${getSeatColorClass(showSeat)}
                        `}
                        title={`${row}${showSeat.seat.number} - ${showSeat.seat.type}`}
                      >
                        <span className="relative z-10">{showSeat.seat.number}</span>
                        
                        {/* Seat armrest details */}
                        <div className="absolute inset-0 border-x-4 border-black/10 pointer-events-none"></div>
                        <div className="absolute top-0 inset-x-0 h-1/3 bg-white/5 pointer-events-none"></div>
                      </button>
                    );
                  })}
                </div>

                {/* Row Label (Right) */}
                <span className="w-8 text-sm font-bold text-slate-600 text-center group-hover:text-indigo-400 transition-colors">{row}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-medium text-slate-400 mt-12 bg-[#0A0A12] border border-[#1E1E2E] px-8 py-4 rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded border border-[#1E1E2E] bg-[#05050A]" />
            <span>Available (Standard)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded border border-indigo-500/30 bg-indigo-500/10" />
            <span>Available (Premium)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded border border-purple-500/30 bg-purple-500/10" />
            <span>Available (Recliner)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-emerald-500 border border-emerald-400" />
            <span className="text-white font-semibold">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-[#1E1E2E] border-[#1E1E2E]" />
            <span>Booked</span>
          </div>
        </div>
      </main>

      {/* Floating Reservation Status Bar */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-3xl w-[95%] rounded-3xl border border-indigo-500/40 bg-[#0A0A12]/90 p-5 shadow-[0_0_40px_rgba(79,70,229,0.2)] backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Armchair className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Selected {selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'}
              </div>
              <div className="font-extrabold text-white text-lg">
                {selectedSeats.map((s) => `${s.seat.row}${s.seat.number}`).join(', ')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right flex flex-col items-end">
              <span className="block text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-1">Total Amount</span>
              <span className="text-2xl font-black text-white leading-none">₹{totalAmount}</span>
            </div>

            <Button
              size="lg"
              onClick={handleProceedToLock}
              disabled={isLocking}
              className="px-8 shadow-[0_0_20px_rgba(79,70,229,0.4)] font-bold text-sm"
            >
              {isLocking ? (
                'Locking...'
              ) : (
                <span className="flex items-center gap-2">
                  Checkout <ShieldCheck className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
