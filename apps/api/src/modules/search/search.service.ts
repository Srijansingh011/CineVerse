import { prisma } from '@repo/database';

type SearchType = 'movies' | 'theatres' | 'users' | 'reviews' | 'lists' | 'all';

export class SearchService {
  async search(query: string, type: SearchType = 'all', page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const q = query.trim();
    if (!q) return { results: [], total: 0 };

    const results: any[] = [];
    let total = 0;

    if (type === 'movies' || type === 'all') {
      const [movies, movieCount] = await Promise.all([
        prisma.movie.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { overview: { contains: q, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true, title: true, posterPath: true, rating: true,
            genres: true, releaseDate: true, status: true,
          },
          skip: type === 'movies' ? skip : 0,
          take: type === 'movies' ? limit : 5,
          orderBy: { rating: 'desc' },
        }),
        prisma.movie.count({
          where: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { overview: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
      ]);
      results.push(...movies.map((m) => ({ ...m, _type: 'movie' })));
      if (type === 'movies') total = movieCount;
    }

    if (type === 'theatres' || type === 'all') {
      const [theatres, theatreCount] = await Promise.all([
        prisma.theatre.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { address: { contains: q, mode: 'insensitive' } },
            ],
          },
          include: { city: { select: { name: true } } },
          skip: type === 'theatres' ? skip : 0,
          take: type === 'theatres' ? limit : 5,
        }),
        prisma.theatre.count({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { address: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
      ]);
      results.push(...theatres.map((t) => ({ ...t, _type: 'theatre' })));
      if (type === 'theatres') total = theatreCount;
    }

    if (type === 'users' || type === 'all') {
      const [users, userCount] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
          select: { id: true, name: true, email: true, level: true, xp: true },
          skip: type === 'users' ? skip : 0,
          take: type === 'users' ? limit : 5,
        }),
        prisma.user.count({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
      ]);
      results.push(...users.map((u) => ({ ...u, _type: 'user' })));
      if (type === 'users') total = userCount;
    }

    if (type === 'reviews' || type === 'all') {
      const [reviews, reviewCount] = await Promise.all([
        prisma.review.findMany({
          where: { content: { contains: q, mode: 'insensitive' } },
          include: {
            user: { select: { id: true, name: true } },
            movie: { select: { id: true, title: true, posterPath: true } },
          },
          skip: type === 'reviews' ? skip : 0,
          take: type === 'reviews' ? limit : 5,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.review.count({ where: { content: { contains: q, mode: 'insensitive' } } }),
      ]);
      results.push(...reviews.map((r) => ({ ...r, _type: 'review' })));
      if (type === 'reviews') total = reviewCount;
    }

    if (type === 'lists' || type === 'all') {
      const [lists, listCount] = await Promise.all([
        prisma.userList.findMany({
          where: {
            isPublic: true,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
          include: {
            user: { select: { id: true, name: true } },
            _count: { select: { movies: true } },
          },
          skip: type === 'lists' ? skip : 0,
          take: type === 'lists' ? limit : 5,
        }),
        prisma.userList.count({
          where: {
            isPublic: true,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
      ]);
      results.push(...lists.map((l) => ({ ...l, _type: 'list' })));
      if (type === 'lists') total = listCount;
    }

    if (type === 'all') total = results.length;

    return { results, total, page, pages: Math.ceil(total / limit) };
  }
}

export const searchService = new SearchService();
