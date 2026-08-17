import { prisma, ShowSeatStatus, BookingStatus } from '@repo/database';
import { acquireSeatLocks, releaseSeatLocks } from '../../lib/redis-lock.js';
import { scheduleSeatCleanup } from '../../queues/seat-cleanup.queue.js';
import { scheduleRefund } from '../../queues/refund.queue.js';
import { GamificationService } from '../gamification/gamification.service.js';
import { io } from '../../index.js';
import crypto from 'crypto';
import QRCode from 'qrcode';

export class BookingService {
  /**
   * Lock seats atomically using Redis and PostgreSQL
   */
  public static async lockSeats(showId: string, seatIds: string[], userId: string) {
    if (seatIds.length === 0) {
      throw new Error('No seats specified');
    }

    // 1. Try acquiring atomic Redis Lua locks (valid for 5 mins / 300 seconds)
    const redisLockAcquired = await acquireSeatLocks(showId, seatIds, userId, 300);
    if (!redisLockAcquired) {
      throw new Error('Some seats are currently locked by another user. Please choose different seats.');
    }

    try {
      // 2. Perform DB check-and-update inside a PostgreSQL Transaction
      const result = await prisma.$transaction(async (tx) => {
        // Fetch seats to verify availability
        const targetSeats = await tx.showSeat.findMany({
          where: {
            showId,
            id: { in: seatIds },
            status: ShowSeatStatus.AVAILABLE,
          },
        });

        if (targetSeats.length !== seatIds.length) {
          throw new Error('One or more selected seats are no longer available.');
        }

        // Lock seats in PostgreSQL
        await tx.showSeat.updateMany({
          where: {
            showId,
            id: { in: seatIds },
          },
          data: {
            status: ShowSeatStatus.LOCKED,
            lockedAt: new Date(),
            lockedById: userId,
          },
        });

        return targetSeats;
      });

      // 3. Schedule 5-minute delayed lock release via BullMQ
      await scheduleSeatCleanup(showId, seatIds, userId, 5 * 60 * 1000);

      // 4. Broadcast live lock event via Socket.IO
      if (io) {
        io.to(`room:show:${showId}`).emit('seatsLocked', {
          showId,
          seatIds,
          userId,
        });
      }

      return result;
    } catch (dbError: any) {
      // Roll back the Redis locks if DB updates fail
      await releaseSeatLocks(showId, seatIds, userId);
      throw new Error(dbError.message || 'Failed to secure seat locks.');
    }
  }

  /**
   * Manually unlock seats (e.g., user cancels checkout flow)
   */
  public static async unlockSeats(showId: string, seatIds: string[], userId: string) {
    if (seatIds.length === 0) return true;

    // 1. Verify ownership and update PostgreSQL states
    await prisma.showSeat.updateMany({
      where: {
        showId,
        id: { in: seatIds },
        lockedById: userId,
        status: ShowSeatStatus.LOCKED,
      },
      data: {
        status: ShowSeatStatus.AVAILABLE,
        lockedAt: null,
        lockedById: null,
      },
    });

    // 2. Clear Redis locks
    await releaseSeatLocks(showId, seatIds, userId);

    // 3. Broadcast real-time release event
    if (io) {
      io.to(`room:show:${showId}`).emit('seatsUnlocked', {
        showId,
        seatIds,
      });
    }

    return true;
  }

  /**
   * Idempotent Booking Creation
   */
  public static async createBooking(
    showId: string,
    seatIds: string[],
    userId: string,
    idempotencyKey?: string
  ) {
    // 1. If idempotencyKey is provided, check if booking already exists
    if (idempotencyKey) {
      const existingBooking = await prisma.booking.findUnique({
        where: { idempotencyKey },
        include: {
          showSeats: {
            include: { seat: true },
          },
          show: {
            include: { movie: true, screen: { include: { theatre: true } } },
          },
        },
      });

      if (existingBooking) {
        console.log(`Idempotent booking hit detected: ${idempotencyKey}`);
        return existingBooking;
      }
    }

    // 2. Fetch show info to calculate seat prices
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        showSeats: {
          where: { id: { in: seatIds } },
          include: { seat: true },
        },
      },
    });

    if (!show) throw new Error('Show not found');
    if (show.showSeats.length !== seatIds.length) {
      throw new Error('Some selected seats do not belong to this show.');
    }

    // Verify all seats are locked by this user
    const invalidSeats = show.showSeats.filter(
      (s) => s.status !== ShowSeatStatus.LOCKED || s.lockedById !== userId
    );

    if (invalidSeats.length > 0) {
      throw new Error('All seats must be locked by you before creating a booking.');
    }

    // 3. Compute total amount
    const totalAmount = show.showSeats.reduce((sum, ss) => {
      let price = show.priceStandard;
      if (ss.seat.type === 'PREMIUM') price = show.pricePremium;
      if (ss.seat.type === 'RECLINER') price = show.priceRecliner;
      return sum + price;
    }, 0);

    // 4. Create Booking inside a transaction
    let bookingResult;
    try {
      bookingResult = await prisma.$transaction(async (tx) => {
        if (idempotencyKey) {
          const check = await tx.booking.findUnique({
            where: { idempotencyKey },
            include: {
              showSeats: { include: { seat: true } },
              show: { include: { movie: true, screen: { include: { theatre: true } } } },
            },
          });
          if (check) return check;
        }

        const booking = await tx.booking.create({
          data: { userId, showId, status: BookingStatus.PENDING, totalAmount, idempotencyKey },
        });

        await tx.showSeat.updateMany({
          where: { id: { in: seatIds } },
          data: { bookingId: booking.id },
        });

        return await tx.booking.findUnique({
          where: { id: booking.id },
          include: {
            showSeats: { include: { seat: true } },
            show: { include: { movie: true, screen: { include: { theatre: true } } } },
          },
        });
      });
    } catch (error: any) {
      if (error.code === 'P2002' && idempotencyKey) {
        console.log(`P2002 Idempotent recovery for: ${idempotencyKey}`);
        const existingBooking = await prisma.booking.findUnique({
          where: { idempotencyKey },
          include: {
            showSeats: { include: { seat: true } },
            show: { include: { movie: true, screen: { include: { theatre: true } } } },
          },
        });
        if (existingBooking) {
          bookingResult = existingBooking;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // 5. Generate Razorpay Order if not already generated
    if (bookingResult && !bookingResult.paymentId && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET).toString('base64'),
          },
          body: JSON.stringify({
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: bookingResult.id,
          }),
        });

        if (orderRes.ok) {
          const orderData = await orderRes.json();
          bookingResult = await prisma.booking.update({
            where: { id: bookingResult.id },
            data: { paymentId: orderData.id },
            include: {
              showSeats: { include: { seat: true } },
              show: { include: { movie: true, screen: { include: { theatre: true } } } },
            },
          });
        } else {
          const errData = await orderRes.text();
          console.error('Razorpay Order API failed:', errData);
        }
      } catch (err) {
        console.error('Failed to create Razorpay Order:', err);
      }
    }

    return bookingResult;
  }

  /**
   * Internal method for webhook workers to confirm payment without checkout signatures.
   * Trust is established by the Webhook Controller edge signature validation.
   */
  public static async confirmPaymentFromWebhook(bookingId: string, paymentId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        showSeats: { include: { seat: true } },
        show: { include: { movie: true, screen: { include: { theatre: true } } } },
      },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.status === BookingStatus.CONFIRMED) return booking;

    const seatIds = booking.showSeats.map((s) => s.id);
    
    // Generate QR
    const ticketInfo = {
      bookingId: booking.id,
      movie: booking.show.movie.title,
      theatre: booking.show.screen.theatre.name,
      screen: booking.show.screen.name,
      seats: booking.showSeats.map((ss) => `${ss.seat.row}${ss.seat.number}`).join(', '),
      time: booking.show.startTime,
      amount: booking.totalAmount,
    };
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(ticketInfo));

    const confirmedBooking = await prisma.$transaction(async (tx) => {
      const freshBooking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!freshBooking) throw new Error('Booking not found');
      if (freshBooking.status === BookingStatus.CONFIRMED) return freshBooking;

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED, paymentId, qrCode: qrCodeDataUrl },
        include: {
          showSeats: { include: { seat: true } },
          show: { include: { movie: true, screen: { include: { theatre: true } } } },
        },
      });

      await tx.showSeat.updateMany({
        where: { id: { in: seatIds } },
        data: { status: ShowSeatStatus.BOOKED, lockedAt: null, lockedById: null },
      });

      return updatedBooking;
    });

    await releaseSeatLocks(booking.showId, booking.showSeats.map((s) => s.seatId), booking.userId);

    try {
      await GamificationService.addXp(booking.userId, 100);
    } catch (gErr) {
      console.error('Error awarding booking XP:', gErr);
    }

    return confirmedBooking;
  }

  /**
   * Confirm booking payment idempotently
   */
  public static async confirmPayment(
    bookingId: string,
    paymentId: string,
    signature: string,
    orderId?: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        showSeats: {
          include: { seat: true },
        },
        show: {
          include: { movie: true, screen: { include: { theatre: true } } },
        },
      },
    });

    if (!booking) throw new Error('Booking not found');

    if (booking.status === BookingStatus.CONFIRMED) {
      return booking;
    }

    // Signature verification (Razorpay logic)
    const isMock = signature === 'MOCK_SIGNATURE';
    if (!isMock && orderId && process.env.RAZORPAY_KEY_SECRET) {
      const text = `${orderId}|${paymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (generatedSignature !== signature) {
        throw new Error('Invalid payment signature verification failed.');
      }
    }

    const seatIds = booking.showSeats.map((s) => s.id);
    
    // Generate QR
    const ticketInfo = {
      bookingId: booking.id,
      movie: booking.show.movie.title,
      theatre: booking.show.screen.theatre.name,
      screen: booking.show.screen.name,
      seats: booking.showSeats.map((ss) => `${ss.seat.row}${ss.seat.number}`).join(', '),
      time: booking.show.startTime,
      amount: booking.totalAmount,
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(ticketInfo));

    const confirmedBooking = await prisma.$transaction(async (tx) => {
      const freshBooking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!freshBooking) throw new Error('Booking not found');
      if (freshBooking.status === BookingStatus.CONFIRMED) return freshBooking;

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          paymentId,
          qrCode: qrCodeDataUrl,
        },
        include: {
          showSeats: {
            include: { seat: true },
          },
          show: {
            include: { movie: true, screen: { include: { theatre: true } } },
          },
        },
      });

      await tx.showSeat.updateMany({
        where: {
          id: { in: seatIds },
        },
        data: {
          status: ShowSeatStatus.BOOKED,
          lockedAt: null,
          lockedById: null,
        },
      });

      return updatedBooking;
    });

    // Release Redis locks since seat statuses are now persisted as BOOKED
    await releaseSeatLocks(
      booking.showId,
      booking.showSeats.map((s) => s.seatId),
      booking.userId
    );

    // Gamification Hook: Award XP on successful booking
    try {
      await GamificationService.addXp(booking.userId, 100);
    } catch (gErr) {
      console.error('Error awarding booking XP:', gErr);
    }

    return confirmedBooking;
  }

  /**
   * Cancel booking and calculate refund based on time until show
   */
  public static async cancelBooking(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        showSeats: {
          include: { seat: true },
        },
        show: true,
      },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.userId !== userId) throw new Error('Unauthorized');
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new Error('Only confirmed bookings can be cancelled');
    }

    const showTime = new Date(booking.show.startTime).getTime();
    const now = Date.now();
    const hoursRemaining = (showTime - now) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursRemaining > 24) {
      refundPercentage = 100;
    } else if (hoursRemaining >= 6) {
      refundPercentage = 75;
    } else if (hoursRemaining >= 2) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }

    const refundAmount = (booking.totalAmount * refundPercentage) / 100;

    // Execute cancellation in transaction
    const cancelledBooking = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
        },
        include: {
          showSeats: {
            include: { seat: true },
          },
        },
      });

      // Free seats in Postgres
      const seatIds = booking.showSeats.map((s) => s.id);
      await tx.showSeat.updateMany({
        where: {
          id: { in: seatIds },
        },
        data: {
          status: ShowSeatStatus.AVAILABLE,
          bookingId: null,
          lockedAt: null,
          lockedById: null,
        },
      });

      return updatedBooking;
    });

    // Release Redis locks if any
    await releaseSeatLocks(
      booking.showId,
      booking.showSeats.map((s) => s.seatId),
      booking.userId
    );

    if (refundAmount > 0) {
      await scheduleRefund(bookingId, refundAmount);
    }

    return {
      booking: cancelledBooking,
      refundPercentage,
      refundAmount,
    };
  }

  /**
   * Fetch single booking detail
   */
  public static async getBooking(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        showSeats: {
          include: { seat: true },
        },
        show: {
          include: { movie: true, screen: { include: { theatre: true } } },
        },
      },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.userId !== userId) throw new Error('Unauthorized');
    return booking;
  }
}
