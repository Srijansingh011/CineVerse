'use client';

import { useState, useEffect, use } from 'react';
import { PageShell } from '../../../components/layout/PageShell';
import { apiFetch } from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { socket } from '../../../lib/socket';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/authStore';
import { Alert } from '../../../components/ui/Alert';
import { Skeleton } from '../../../components/ui/Skeleton';
import { formatShowDate, formatShowTime, rupees } from '../../../lib/format';
import { cn } from '../../../lib/cn';

export default function ShowSeatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: showId } = use(params);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [show, setShow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  const fetchShowDetails = async () => {
    try {
      const response = await apiFetch(`/theatres/shows/${showId}`);
      setShow(response.data);
    } catch (err: any) {
      setError('Couldn’t load this showtime.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShowDetails();
  }, [showId]);

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
            return { ...ss, status: 'LOCKED', lockedById: data.userId };
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
            return { ...ss, status: 'AVAILABLE', lockedById: null };
          }
          return ss;
        });
        return { ...prevShow, showSeats: updatedSeats };
      });
      setSelectedSeats((prevSelected) => prevSelected.filter((s) => !data.seatIds.includes(s.id)));
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
      <PageShell footer={false}>
        <div className="cv-container cv-page"><Skeleton className="h-64 w-full" /></div>
      </PageShell>
    );
  }

  if (error || !show) {
    return (
      <PageShell footer={false}>
        <div className="cv-container cv-page max-w-md mx-auto">
          <Alert title="Unable to load seats" action={<Link href="/shows"><Button variant="outline">Back to showtimes</Button></Link>}>
            {error || 'Show details not found.'}
          </Alert>
        </div>
      </PageShell>
    );
  }

  const seatsByRow: Record<string, any[]> = {};
  show.showSeats.forEach((showSeat: any) => {
    const row = showSeat.seat.row;
    if (!seatsByRow[row]) seatsByRow[row] = [];
    seatsByRow[row].push(showSeat);
  });
  Object.keys(seatsByRow).forEach((row) => {
    seatsByRow[row]?.sort((a, b) => a.seat.number - b.seat.number);
  });
  const rows = Object.keys(seatsByRow).sort();

  const handleSeatClick = (showSeat: any) => {
    if (showSeat.status !== 'AVAILABLE') return;
    const isAlreadySelected = selectedSeats.some((s) => s.id === showSeat.id);
    if (isAlreadySelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== showSeat.id));
    } else {
      if (selectedSeats.length >= 10) {
        setError('You can select up to 10 seats.');
        return;
      }
      setSelectedSeats([...selectedSeats, showSeat]);
    }
  };

  const getSeatPrice = (type: string) => {
    switch (type) {
      case 'PREMIUM': return show.pricePremium;
      case 'RECLINER': return show.priceRecliner;
      default: return show.priceStandard;
    }
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat.seat.type), 0);

  const seatClass = (showSeat: any) => {
    const isSelected = selectedSeats.some((s) => s.id === showSeat.id);
    if (isSelected) return 'bg-primary border-primary text-white';
    switch (showSeat.status) {
      case 'BOOKED':
        return 'bg-surface-2 border-surface-2 text-transparent cursor-not-allowed';
      case 'LOCKED':
        return 'bg-highlight/20 border-highlight/40 text-highlight/70 cursor-not-allowed';
      default:
        if (showSeat.seat.type === 'RECLINER') return 'border-[#8b6b4a] text-[#c4a574] hover:bg-[#8b6b4a]/20';
        if (showSeat.seat.type === 'PREMIUM') return 'border-accent text-accent hover:bg-accent/15';
        return 'border-[var(--border)] text-muted hover:border-white/40';
    }
  };

  const handleProceedToLock = async () => {
    if (selectedSeats.length === 0 || isLocking) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/shows/${showId}`);
      return;
    }
    setIsLocking(true);
    setError(null);
    try {
      const seatIds = selectedSeats.map((s) => s.id);
      await apiFetch('/bookings/lock', {
        method: 'POST',
        body: JSON.stringify({ showId, seatIds }),
      });
      router.push(`/checkout?showId=${showId}&seats=${seatIds.join(',')}`);
    } catch (err: any) {
      if (err.message === 'Session expired') {
        router.push(`/login?redirect=/shows/${showId}`);
        return;
      }
      setError('Those seats were taken. The map has been refreshed.');
      fetchShowDetails();
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <PageShell footer={false}>
      <div className="cv-container pt-6 pb-28 lg:pb-10">
        <div className="mb-6">
          <p className="text-[12px] uppercase tracking-wide text-muted">
            {show.screen.theatre.name} · {show.screen.name}
          </p>
          <h1 className="font-display text-[28px] md:text-[32px] text-white mt-1">{show.movie.title}</h1>
          <p className="text-[14px] text-muted mt-1">
            {formatShowDate(show.startTime)} · {formatShowTime(show.startTime)}
          </p>
        </div>

        {error ? <Alert className="mb-4">{error}</Alert> : null}

        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-8">
            <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted mb-3">Screen</p>
            <div className="h-1.5 w-full max-w-md mx-auto rounded-full bg-white/15 mb-8" />

            <div className="overflow-x-auto scrollbar-hide">
              <div className="min-w-fit mx-auto space-y-2 px-2">
                {rows.map((row) => (
                  <div key={row} className="flex items-center gap-3">
                    <span className="w-5 text-[12px] font-medium text-muted text-center">{row}</span>
                    <div className="flex gap-1.5">
                      {(seatsByRow[row] || []).map((showSeat) => (
                        <button
                          key={showSeat.id}
                          onClick={() => handleSeatClick(showSeat)}
                          disabled={showSeat.status !== 'AVAILABLE'}
                          className={cn(
                            "h-7 w-7 rounded-full border text-[9px] font-medium transition-colors duration-150",
                            seatClass(showSeat)
                          )}
                          title={`${row}${showSeat.seat.number} · ${showSeat.seat.type}`}
                        >
                          {showSeat.seat.number}
                        </button>
                      ))}
                    </div>
                    <span className="w-5 text-[12px] font-medium text-muted text-center">{row}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] text-muted mt-8">
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full border border-[var(--border)] inline-block" /> Available</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-primary inline-block" /> Selected</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-highlight/40 inline-block" /> Locked</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-surface-2 inline-block" /> Booked</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full border border-accent inline-block" /> Premium</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full border border-[#8b6b4a] inline-block" /> Recliner</span>
            </div>
          </div>

          <aside className="hidden lg:block lg:col-span-4">
            <div className="border border-[var(--border)] rounded-[8px] p-5 sticky top-24">
              <h2 className="text-[16px] font-semibold mb-4">Booking summary</h2>
              <dl className="space-y-2 text-[14px]">
                <div className="flex justify-between"><dt className="text-muted">Seats</dt><dd>{selectedSeats.length ? selectedSeats.map((s) => `${s.seat.row}${s.seat.number}`).join(', ') : '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Tickets</dt><dd>{selectedSeats.length}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{rupees(totalAmount)}</dd></div>
                <div className="flex justify-between pt-2 border-t border-[var(--border)]"><dt className="font-semibold">Total</dt><dd className="font-semibold">{rupees(totalAmount)}</dd></div>
              </dl>
              <Button className="w-full mt-5" disabled={!selectedSeats.length || isLocking} onClick={handleProceedToLock}>
                {isLocking ? 'Holding seats…' : 'Continue'}
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-16 inset-x-0 z-40 border-t border-[var(--border)] bg-[#0b0b0f]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] text-muted">{selectedSeats.length} tickets</p>
          <p className="text-[16px] font-semibold">{rupees(totalAmount)}</p>
        </div>
        <Button disabled={!selectedSeats.length || isLocking} onClick={handleProceedToLock}>
          Continue
        </Button>
      </div>
    </PageShell>
  );
}
