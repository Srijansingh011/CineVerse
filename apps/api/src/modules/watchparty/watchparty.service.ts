import { prisma, BookingStatus, ShowSeatStatus } from '@repo/database';
import { acquireSeatLocks, releaseSeatLocks } from '../../lib/redis-lock.js';
import QRCode from 'qrcode';

export class WatchPartyService {
  // ==========================================
  // WATCH PARTY MANAGEMENT
  // ==========================================

  public static async createParty(hostId: string, name: string) {
    const party = await prisma.watchParty.create({
      data: {
        hostId,
        name,
        status: 'VOTING',
        members: {
          create: {
            userId: hostId,
            status: 'JOINED',
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return party;
  }

  public static async inviteUser(partyId: string, email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    return await prisma.watchPartyMember.upsert({
      where: {
        partyId_userId: {
          partyId,
          userId: user.id,
        },
      },
      create: {
        partyId,
        userId: user.id,
        status: 'JOINED',
      },
      update: {
        status: 'JOINED',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  public static async leaveParty(partyId: string, userId: string) {
    const party = await prisma.watchParty.findUnique({
      where: { id: partyId },
    });

    if (!party) throw new Error('Party not found');
    if (party.hostId === userId) {
      throw new Error('Host cannot leave the party. Delete the party instead.');
    }

    await prisma.watchPartyMember.delete({
      where: {
        partyId_userId: {
          partyId,
          userId,
        },
      },
    });

    return true;
  }

  public static async suggestMovie(partyId: string, userId: string, movieId: string) {
    const party = await prisma.watchParty.findUnique({
      where: { id: partyId },
    });

    if (!party) throw new Error('Party not found');
    if (party.status !== 'VOTING') {
      throw new Error('Voting is closed for this party');
    }

    return await prisma.watchPartyVote.upsert({
      where: {
        partyId_userId_movieId: {
          partyId,
          userId,
          movieId,
        },
      },
      create: {
        partyId,
        userId,
        movieId,
      },
      update: {},
      include: {
        movie: true,
      },
    });
  }

  public static async getVotes(partyId: string) {
    const votes = await prisma.watchPartyVote.findMany({
      where: { partyId },
      include: {
        movie: true,
        user: { select: { id: true, name: true } },
      },
    });

    // Group votes by movie
    const movieVotesMap = new Map<string, { movie: any; count: number; voters: string[] }>();

    votes.forEach((v) => {
      const existing = movieVotesMap.get(v.movieId);
      if (existing) {
        existing.count++;
        existing.voters.push(v.user.name || 'Anonymous');
      } else {
        movieVotesMap.set(v.movieId, {
          movie: v.movie,
          count: 1,
          voters: [v.user.name || 'Anonymous'],
        });
      }
    });

    return Array.from(movieVotesMap.values()).sort((a, b) => b.count - a.count);
  }

  public static async selectMovieShow(partyId: string, hostId: string, showId: string) {
    const party = await prisma.watchParty.findUnique({
      where: { id: partyId },
    });

    if (!party) throw new Error('Party not found');
    if (party.hostId !== hostId) throw new Error('Only the host can set the showtime');

    return await prisma.watchParty.update({
      where: { id: partyId },
      data: {
        showId,
        status: 'BOOKING',
      },
      include: {
        show: {
          include: { movie: true, screen: { include: { theatre: true } } },
        },
      },
    });
  }

  public static async getPartyDetails(partyId: string) {
    return await prisma.watchParty.findUnique({
      where: { id: partyId },
      include: {
        host: { select: { id: true, name: true } },
        show: {
          include: { movie: true, screen: { include: { theatre: true } } },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        votes: {
          include: {
            movie: true,
          },
        },
      },
    });
  }

  // ==========================================
  // ADJACENT SEAT ALLOCATION
  // ==========================================

  public static async findAdjacentSeats(showId: string, seatCount: number) {
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        showSeats: {
          where: { status: 'AVAILABLE' },
          include: { seat: true },
        },
      },
    });

    if (!show) throw new Error('Show not found');
    const availableShowSeats = show.showSeats;

    if (availableShowSeats.length < seatCount) {
      throw new Error(`Only ${availableShowSeats.length} seats are available, but ${seatCount} requested`);
    }

    // Group available seats by Row and Seat Category (type)
    const grouped: Record<string, typeof availableShowSeats> = {};
    availableShowSeats.forEach((ss) => {
      const key = `${ss.seat.row}-${ss.seat.type}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ss);
    });

    // Try to find a contiguous sequence of seatCount in each row group
    for (const key in grouped) {
      const group = grouped[key];
      if (!group) continue;
      // Sort seats by seat number ascending
      group.sort((a, b) => a.seat.number - b.seat.number);

      for (let i = 0; i <= group.length - seatCount; i++) {
        const candidate = group.slice(i, i + seatCount);
        let isContiguous = true;
        for (let j = 0; j < seatCount - 1; j++) {
          if (candidate[j + 1]!.seat.number - candidate[j]!.seat.number !== 1) {
            isContiguous = false;
            break;
          }
        }

        if (isContiguous) {
          return candidate.map((ss) => ({
            showSeatId: ss.id,
            seatId: ss.seatId,
            row: ss.seat.row,
            number: ss.seat.number,
            type: ss.seat.type,
          }));
        }
      }
    }

    // Fallback: If no contiguous sequence, find the closest grouping in the same row
    let bestSubset: typeof availableShowSeats = [];
    let minRange = Infinity;

    for (const key in grouped) {
      const group = grouped[key];
      if (!group || group.length < seatCount) continue;
      group.sort((a, b) => a.seat.number - b.seat.number);

      for (let i = 0; i <= group.length - seatCount; i++) {
        const candidate = group.slice(i, i + seatCount);
        const range = candidate[seatCount - 1]!.seat.number - candidate[0]!.seat.number;
        if (range < minRange) {
          minRange = range;
          bestSubset = candidate;
        }
      }
    }

    if (bestSubset.length === seatCount) {
      return bestSubset.map((ss) => ({
        showSeatId: ss.id,
        seatId: ss.seatId,
        row: ss.seat.row,
        number: ss.seat.number,
        type: ss.seat.type,
      }));
    }

    // Absolute fallback: Just return the first seatCount available seats sorted by row/number
    const fallbackSorted = [...availableShowSeats].sort((a, b) => {
      if (a.seat.row !== b.seat.row) return a.seat.row.localeCompare(b.seat.row);
      return a.seat.number - b.seat.number;
    });

    return fallbackSorted.slice(0, seatCount).map((ss) => ({
      showSeatId: ss.id,
      seatId: ss.seatId,
      row: ss.seat.row,
      number: ss.seat.number,
      type: ss.seat.type,
    }));
  }

  // ==========================================
  // SPLIT PAYMENT ENGINE
  // ==========================================

  public static async createSplitPaymentBooking(
    userId: string,
    partyId: string,
    showId: string,
    seatIds: string[],
    shares: { userId: string; amount: number }[]
  ) {
    const show = await prisma.show.findUnique({
      where: { id: showId },
    });
    if (!show) throw new Error('Show not found');

    const totalAmount = shares.reduce((sum, s) => sum + s.amount, 0);

    // 1. Lock seats temporarily in Redis to prevent simultaneous bookings
    // (Locks valid for 15 minutes for group bookings to allow everyone to pay!)
    const lockTtlSeconds = 900; // 15 minutes
    const lockAcquired = await acquireSeatLocks(showId, seatIds, userId, lockTtlSeconds);
    if (!lockAcquired) {
      throw new Error('One or more of the selected seats are currently locked by another user');
    }

    // 2. Create booking and split payment models in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Find show seat records
      const dbShowSeats = await tx.showSeat.findMany({
        where: {
          showId,
          seatId: { in: seatIds },
        },
      });

      if (dbShowSeats.some((s) => s.status !== 'AVAILABLE')) {
        throw new Error('One or more seats are no longer available in the database');
      }

      // Create Booking record
      const newBooking = await tx.booking.create({
        data: {
          userId,
          showId,
          status: 'PENDING',
          totalAmount,
          idempotencyKey: `split-${partyId}-${Date.now()}`,
        },
      });

      // Update show seat booking link and mark locked
      await tx.showSeat.updateMany({
        where: {
          id: { in: dbShowSeats.map((s) => s.id) },
        },
        data: {
          status: 'LOCKED',
          bookingId: newBooking.id,
          lockedAt: new Date(),
          lockedById: userId,
        },
      });

      // Create SplitPayment record
      const splitPayment = await tx.splitPayment.create({
        data: {
          bookingId: newBooking.id,
          partyId,
          totalAmount,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins expiry
          members: {
            create: shares.map((s) => ({
              userId: s.userId,
              amount: s.amount,
              status: 'PENDING',
            })),
          },
        },
        include: {
          members: true,
        },
      });

      return {
        ...newBooking,
        splitPayment,
      };
    });

    return booking;
  }

  public static async paySplitShare(
    userId: string,
    splitPaymentId: string,
    paymentId: string
  ) {
    const splitPayment = await prisma.splitPayment.findUnique({
      where: { id: splitPaymentId },
      include: {
        members: true,
        booking: {
          include: {
            showSeats: { include: { seat: true } },
            show: { include: { movie: true, screen: { include: { theatre: true } } } },
          },
        },
      },
    });

    if (!splitPayment) throw new Error('Split payment record not found');
    if (splitPayment.status !== 'PENDING') {
      throw new Error(`Split payment is already ${splitPayment.status}`);
    }

    if (new Date() > new Date(splitPayment.expiresAt)) {
      throw new Error('Split payment has expired');
    }

    const member = splitPayment.members.find((m) => m.userId === userId);
    if (!member) throw new Error('User is not a member of this split booking');
    if (member.status === 'PAID') return splitPayment; // Already paid

    // Update member status
    const updatedMember = await prisma.splitPaymentMember.update({
      where: {
        splitPaymentId_userId: {
          splitPaymentId,
          userId,
        },
      },
      data: {
        status: 'PAID',
        paymentId,
        paidAt: new Date(),
      },
    });

    // Check if everyone has paid
    const freshSplit = await prisma.splitPayment.findUnique({
      where: { id: splitPaymentId },
      include: { members: true },
    });

    const allPaid = freshSplit?.members.every((m) => m.status === 'PAID');

    if (allPaid) {
      // 1. Confirm the group booking
      const seatIds = splitPayment.booking.showSeats.map((s) => s.id);
      
      const ticketInfo = {
        bookingId: splitPayment.booking.id,
        movie: splitPayment.booking.show.movie.title,
        theatre: splitPayment.booking.show.screen.theatre.name,
        screen: splitPayment.booking.show.screen.name,
        seats: splitPayment.booking.showSeats.map((ss) => `${ss.seat.row}${ss.seat.number}`).join(', '),
        time: splitPayment.booking.show.startTime,
        amount: splitPayment.booking.totalAmount,
      };

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(ticketInfo));

      await prisma.$transaction([
        prisma.splitPayment.update({
          where: { id: splitPaymentId },
          data: { status: 'PAID' },
        }),
        prisma.booking.update({
          where: { id: splitPayment.bookingId },
          data: {
            status: BookingStatus.CONFIRMED,
            paymentId: `group-${splitPaymentId}`,
            qrCode: qrCodeDataUrl,
          },
        }),
        prisma.showSeat.updateMany({
          where: {
            id: { in: seatIds },
          },
          data: {
            status: ShowSeatStatus.BOOKED,
            lockedAt: null,
            lockedById: null,
          },
        }),
        // Also update watch party status if linked
        ...(splitPayment.partyId
          ? [
              prisma.watchParty.update({
                where: { id: splitPayment.partyId },
                data: { status: 'COMPLETED' },
              }),
            ]
          : []),
      ]);

      // Release Redis locks
      await releaseSeatLocks(
        splitPayment.booking.showId,
        splitPayment.booking.showSeats.map((s) => s.seatId),
        splitPayment.booking.userId
      );
    }

    return await prisma.splitPayment.findUnique({
      where: { id: splitPaymentId },
      include: { members: true },
    });
  }

  /**
   * Periodically releases expired bookings
   */
  public static async releaseExpiredSplits() {
    const expiredSplits = await prisma.splitPayment.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      include: {
        booking: {
          include: { showSeats: true },
        },
      },
    });

    for (const split of expiredSplits) {
      const seatIds = split.booking.showSeats.map((s) => s.id);

      await prisma.$transaction([
        prisma.splitPayment.update({
          where: { id: split.id },
          data: { status: 'EXPIRED' },
        }),
        prisma.booking.update({
          where: { id: split.bookingId },
          data: { status: BookingStatus.FAILED },
        }),
        prisma.showSeat.updateMany({
          where: {
            id: { in: seatIds },
          },
          data: {
            status: ShowSeatStatus.AVAILABLE,
            bookingId: null,
            lockedAt: null,
            lockedById: null,
          },
        }),
      ]);

      // Release Redis locks
      await releaseSeatLocks(
        split.booking.showId,
        split.booking.showSeats.map((s) => s.seatId),
        split.booking.userId
      );

      // Note: In real life, trigger automatic refunds for any members who had paid
      // by placing them in the refund queue.
    }

    return expiredSplits.length;
  }
}
