'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageShell } from '../../components/layout/PageShell';
import { apiFetch } from '../../lib/api';
import { ShieldCheck, QrCode, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatShowDate, formatShowTime, rupees } from '../../lib/format';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showId = searchParams.get('showId') || '';
  const seatsParam = searchParams.get('seats') || '';

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);

  useEffect(() => {
    if (!showId || !seatsParam) {
      setError('Missing show or seats. Please select seats first.');
      setLoading(false);
      return;
    }

    const initBooking = async () => {
      try {
        const seatIds = seatsParam.split(',');
        const idempotencyKey = `booking-${showId}-${seatsParam.replace(/,/g, '-')}`;
        const res = await apiFetch('/bookings', {
          method: 'POST',
          body: JSON.stringify({ showId, seatIds, idempotencyKey }),
        });
        setBooking(res.data);
      } catch (err: any) {
        setError('Couldn’t start checkout. Your seat hold may have expired.');
      } finally {
        setLoading(false);
      }
    };

    initBooking();
  }, [showId, seatsParam]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    if (!booking) return;
    setIsProcessingPayment(true);
    setError(null);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Payment window failed to load.');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: Math.round(Number(booking.totalAmount) * 100),
        currency: 'INR',
        order_id: booking.paymentId,
        name: 'CineVerse',
        description: `Booking for ${booking.show.movie.title}`,
        notes: { bookingId: booking.id },
        handler: async function (response: any) {
          try {
            const confirmRes = await apiFetch('/bookings/confirm-payment', {
              method: 'POST',
              body: JSON.stringify({
                bookingId: booking.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                orderId: response.razorpay_order_id || 'order_mock_' + Date.now(),
              }),
            });
            setPaymentSuccessData(confirmRes.data);
          } catch {
            setError('Payment could not be verified. Contact support if you were charged.');
          }
        },
        prefill: {
          name: 'CineVerse Customer',
          email: 'customer@cineverse.com',
        },
        theme: { color: '#5b5bd6' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      setError('Couldn’t open Razorpay. You can use the development payment option.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleMockPayment = async () => {
    if (!booking) return;
    setIsProcessingPayment(true);
    setError(null);
    try {
      const confirmRes = await apiFetch('/bookings/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: booking.id,
          paymentId: 'pay_mock_' + Math.random().toString(36).substring(2, 9),
          signature: 'MOCK_SIGNATURE',
          orderId: 'order_mock_' + Math.random().toString(36).substring(2, 9),
        }),
      });
      setPaymentSuccessData(confirmRes.data);
    } catch {
      setError('Payment confirmation failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <PageShell footer={false}>
        <div className="cv-container cv-page"><Skeleton className="h-48 w-full" /></div>
      </PageShell>
    );
  }

  if (error && !booking && !paymentSuccessData) {
    return (
      <PageShell footer={false}>
        <div className="cv-container cv-page max-w-md">
          <Alert action={<Button onClick={() => router.push('/shows')}>Return to showtimes</Button>}>{error}</Alert>
        </div>
      </PageShell>
    );
  }

  if (paymentSuccessData) {
    const confirmed = paymentSuccessData;
    return (
      <PageShell>
        <main className="cv-container cv-page max-w-md">
          <p className="text-[13px] text-success font-medium mb-4">Payment confirmed</p>
          <h1 className="font-display text-[32px] text-white mb-6">Your ticket</h1>

          <div className="relative bg-surface border border-[var(--border)] overflow-hidden">
            <div className="p-6">
              <p className="text-[11px] tracking-[0.2em] uppercase text-muted">CineVerse</p>
              <h2 className="mt-2 text-[22px] font-semibold leading-tight">{confirmed.show.movie.title}</h2>
              <p className="mt-1 text-[14px] text-muted">{confirmed.show.screen.theatre.name}</p>

              <div className="mt-6 grid grid-cols-2 gap-4 text-[14px]">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">Screen</p>
                  <p className="mt-0.5">{confirmed.show.screen.name}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">Date</p>
                  <p className="mt-0.5">{formatShowDate(confirmed.show.startTime)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">Time</p>
                  <p className="mt-0.5">{formatShowTime(confirmed.show.startTime)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted">Seats</p>
                  <p className="mt-0.5 font-medium">{confirmed.showSeats.map((ss: any) => `${ss.seat.row}${ss.seat.number}`).join(', ')}</p>
                </div>
              </div>
            </div>

            <div className="relative h-4">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-3 bg-background rounded-r-full border-r border-[var(--border)]" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-3 bg-background rounded-l-full border-l border-[var(--border)]" />
              <div className="absolute inset-x-6 top-1/2 border-t border-dashed border-[var(--border)]" />
            </div>

            <div className="p-6 flex flex-col items-center">
              {confirmed.qrCode ? (
                <div className="bg-white p-2">
                  <img src={confirmed.qrCode} alt="Ticket QR" className="h-32 w-32 object-contain" />
                </div>
              ) : (
                <QrCode className="h-16 w-16 text-muted" />
              )}
              <p className="mt-3 text-[12px] font-mono text-muted">Booking {confirmed.id}</p>
              <p className="text-[12px] font-mono text-muted">Payment {confirmed.paymentId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-6">
            <Button variant="outline" onClick={() => window.print()}>Download</Button>
            <Button variant="outline" onClick={() => {
              if (navigator.share) navigator.share({ title: 'CineVerse ticket', text: confirmed.show.movie.title });
            }}>Share</Button>
            <Button variant="ghost" onClick={() => {
              const start = new Date(confirmed.show.startTime);
              const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(confirmed.show.movie.title)}&dates=${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
              window.open(url, '_blank');
            }}>
              <Calendar className="h-4 w-4" /> Add to calendar
            </Button>
            <Link href="/"><Button className="w-full">Back home</Button></Link>
          </div>
        </main>
      </PageShell>
    );
  }

  const tickets = booking.showSeats.length;
  const convenience = tickets * 25;
  const gst = booking.totalAmount * 0.18;
  const total = booking.totalAmount + convenience + gst;

  return (
    <PageShell footer={false}>
      <main className="cv-container cv-page">
        <h1 className="font-display text-[36px] text-white mb-8">Checkout</h1>
        {error ? <Alert className="mb-6">{error}</Alert> : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-[20px] font-semibold">{booking.show.movie.title}</h2>
              <dl className="mt-4 grid grid-cols-2 gap-y-3 text-[14px]">
                <div><dt className="text-muted">Cinema</dt><dd className="mt-0.5">{booking.show.screen.theatre.name}</dd></div>
                <div><dt className="text-muted">Screen</dt><dd className="mt-0.5">{booking.show.screen.name}</dd></div>
                <div><dt className="text-muted">Date</dt><dd className="mt-0.5">{formatShowDate(booking.show.startTime)}</dd></div>
                <div><dt className="text-muted">Time</dt><dd className="mt-0.5">{formatShowTime(booking.show.startTime)}</dd></div>
                <div className="col-span-2">
                  <dt className="text-muted">Seats</dt>
                  <dd className="mt-0.5">{booking.showSeats.map((ss: any) => `${ss.seat.row}${ss.seat.number}`).join(', ')}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="border border-[var(--border)] rounded-[8px] p-5">
              <h3 className="text-[16px] font-semibold mb-4">Price breakdown</h3>
              <div className="space-y-2 text-[14px]">
                <div className="flex justify-between"><span className="text-muted">Tickets ({tickets})</span><span>{rupees(booking.totalAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Convenience fee</span><span>{rupees(convenience)}</span></div>
                <div className="flex justify-between"><span className="text-muted">GST</span><span>{rupees(gst)}</span></div>
                <div className="flex justify-between pt-3 mt-2 border-t border-[var(--border)] text-[16px] font-semibold">
                  <span>Total</span><span>{rupees(total)}</span>
                </div>
              </div>
              <Button className="w-full mt-6" size="lg" onClick={handleRazorpayPayment} disabled={isProcessingPayment}>
                {isProcessingPayment ? 'Opening payment…' : 'Pay now'}
              </Button>
              <Button variant="ghost" className="w-full mt-2" onClick={handleMockPayment} disabled={isProcessingPayment}>
                Development payment
              </Button>
              <p className="mt-4 text-[12px] text-muted flex items-center gap-1.5 justify-center">
                <ShieldCheck className="h-3.5 w-3.5 text-success" /> Encrypted checkout via Razorpay
              </p>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageShell footer={false}><div className="cv-container cv-page"><Skeleton className="h-48" /></div></PageShell>}>
      <CheckoutContent />
    </Suspense>
  );
}
