import { prisma } from '@repo/database';

export class OwnerService {
  // ── My Theatres ──────────────────────────────────────────────
  async listMyTheatres(ownerId: string) {
    return prisma.theatre.findMany({
      where: { ownerId },
      include: {
        city: { select: { name: true } },
        _count: { select: { screens: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Screens ──────────────────────────────────────────────────
  async listScreens(theatreId: string, ownerId: string) {
    // Verify ownership
    const theatre = await prisma.theatre.findFirst({ where: { id: theatreId, ownerId } });
    if (!theatre) throw new Error('Theatre not found or unauthorized');
    return prisma.screen.findMany({
      where: { theatreId },
      include: { _count: { select: { seats: true, shows: true } } },
    });
  }

  // ── Shows ────────────────────────────────────────────────────
  async listMyShows(ownerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    // Get all theatre IDs owned by this user
    const theatres = await prisma.theatre.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const theatreIds = theatres.map((t) => t.id);

    const [shows, total] = await Promise.all([
      prisma.show.findMany({
        where: { screen: { theatreId: { in: theatreIds } } },
        include: {
          movie: { select: { title: true, posterPath: true } },
          screen: {
            select: {
              name: true,
              theatre: { select: { name: true } },
            },
          },
          _count: { select: { bookings: true, showSeats: true } },
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
      prisma.show.count({
        where: { screen: { theatreId: { in: theatreIds } } },
      }),
    ]);
    return { shows, total, page, pages: Math.ceil(total / limit) };
  }

  // ── Bookings ─────────────────────────────────────────────────
  async listMyBookings(ownerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const theatres = await prisma.theatre.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const theatreIds = theatres.map((t) => t.id);

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { show: { screen: { theatreId: { in: theatreIds } } } },
        include: {
          user: { select: { id: true, name: true, email: true } },
          show: {
            select: {
              startTime: true,
              movie: { select: { title: true } },
              screen: { select: { name: true, theatre: { select: { name: true } } } },
            },
          },
          showSeats: { include: { seat: { select: { row: true, number: true, type: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({
        where: { show: { screen: { theatreId: { in: theatreIds } } } },
      }),
    ]);
    return { bookings, total, page, pages: Math.ceil(total / limit) };
  }

  // ── Revenue Analytics ─────────────────────────────────────────
  async getRevenueAnalytics(ownerId: string) {
    const theatres = await prisma.theatre.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const theatreIds = theatres.map((t) => t.id);

    const confirmedBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        show: { screen: { theatreId: { in: theatreIds } } },
      },
      select: { totalAmount: true, createdAt: true },
    });

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalBookings = confirmedBookings.length;

    // Monthly revenue aggregation
    const monthlyMap: Record<string, number> = {};
    confirmedBookings.forEach((b) => {
      const key = b.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyMap[key] = (monthlyMap[key] || 0) + b.totalAmount;
    });
    const monthlyRevenue = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));

    // Occupancy: booked seats / total show seats
    const [bookedSeats, totalShowSeats] = await Promise.all([
      prisma.showSeat.count({
        where: {
          status: 'BOOKED',
          show: { screen: { theatreId: { in: theatreIds } } },
        },
      }),
      prisma.showSeat.count({
        where: { show: { screen: { theatreId: { in: theatreIds } } } },
      }),
    ]);
    const occupancyRate = totalShowSeats > 0
      ? ((bookedSeats / totalShowSeats) * 100).toFixed(1)
      : '0';

    return {
      totalRevenue,
      totalBookings,
      monthlyRevenue,
      occupancyRate: `${occupancyRate}%`,
      bookedSeats,
      totalShowSeats,
    };
  }
}

export const ownerService = new OwnerService();
