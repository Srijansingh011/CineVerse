import { prisma } from '@repo/database';

export class AdminService {
  // ── Users ────────────────────────────────────────────────────
  async listUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true,
          createdAt: true, xp: true, level: true,
          _count: { select: { bookings: true, reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    return { users, total, page, pages: Math.ceil(total / limit) };
  }

  async updateUserRole(userId: string, role: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async deleteUser(userId: string) {
    return prisma.user.delete({ where: { id: userId } });
  }

  // ── Theatres ─────────────────────────────────────────────────
  async listTheatres(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [theatres, total] = await Promise.all([
      prisma.theatre.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
          city: { select: { name: true } },
          _count: { select: { screens: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.theatre.count(),
    ]);
    return { theatres, total, page, pages: Math.ceil(total / limit) };
  }

  // ── Movies ────────────────────────────────────────────────────
  async listMovies(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? { title: { contains: search, mode: 'insensitive' as const } }
      : {};
    const [movies, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        select: {
          id: true, title: true, status: true, rating: true,
          releaseDate: true, language: true, genres: true,
          _count: { select: { reviews: true, shows: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.movie.count({ where }),
    ]);
    return { movies, total, page, pages: Math.ceil(total / limit) };
  }

  async updateMovieStatus(movieId: string, status: string) {
    return prisma.movie.update({
      where: { id: movieId },
      data: { status: status as any },
    });
  }

  // ── Reviews ───────────────────────────────────────────────────
  async listReviews(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          movie: { select: { id: true, title: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count(),
    ]);
    return { reviews, total, page, pages: Math.ceil(total / limit) };
  }

  async deleteReview(reviewId: string) {
    return prisma.review.delete({ where: { id: reviewId } });
  }

  // ── Analytics ─────────────────────────────────────────────────
  async getPlatformAnalytics() {
    const [
      totalUsers, totalMovies, totalBookings, totalTheatres,
      confirmedBookings, cancelledBookings, recentBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.movie.count(),
      prisma.booking.count(),
      prisma.theatre.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.findMany({
        where: { status: 'CONFIRMED' },
        select: { totalAmount: true },
      }),
    ]);

    const totalRevenue = recentBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const cancellationRate = totalBookings > 0
      ? ((cancelledBookings / totalBookings) * 100).toFixed(1)
      : '0';

    return {
      totalUsers,
      totalMovies,
      totalBookings,
      totalTheatres,
      confirmedBookings,
      cancelledBookings,
      totalRevenue,
      cancellationRate: `${cancellationRate}%`,
    };
  }

  // ── Audit Logs ────────────────────────────────────────────────
  async getAuditLogs(page = 1, limit = 50, action?: string) {
    const skip = (page - 1) * limit;
    const where = action ? { action: { contains: action, mode: 'insensitive' as const } } : {};
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { logs, total, page, pages: Math.ceil(total / limit) };
  }

  async createAuditLog(data: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({ data });
  }
}

export const adminService = new AdminService();
