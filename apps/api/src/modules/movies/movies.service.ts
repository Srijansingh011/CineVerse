import { prisma, MovieStatus } from '@repo/database';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Highly polished mock data to fallback on if no API Key is provided
const MOCK_MOVIES = [
  {
    tmdbId: 157336,
    title: 'Interstellar',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    posterPath: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=500',
    backdropPath: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1280',
    releaseDate: '2014-11-05',
    runtime: 169,
    rating: 4.8,
    language: 'en',
    genres: ['Adventure', 'Drama', 'Science Fiction'],
    status: MovieStatus.NOW_SHOWING,
  },
  {
    tmdbId: 27205,
    title: 'Inception',
    overview: 'Cobb, a skilled thief who steals valuable secrets from deep within the subconscious during the dream state, is offered a chance to have his history erased as payment for a seemingly impossible task.',
    posterPath: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=500',
    backdropPath: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1280',
    releaseDate: '2010-07-15',
    runtime: 148,
    rating: 4.7,
    language: 'en',
    genres: ['Action', 'Science Fiction', 'Adventure'],
    status: MovieStatus.NOW_SHOWING,
  },
  {
    tmdbId: 968051,
    title: 'Dune: Part Two',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
    posterPath: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=500',
    backdropPath: 'https://images.unsplash.com/photo-1682687982501-1e58b814714c?q=80&w=1280',
    releaseDate: '2024-02-27',
    runtime: 166,
    rating: 4.8,
    language: 'en',
    genres: ['Science Fiction', 'Adventure'],
    status: MovieStatus.NOW_SHOWING,
  },
  {
    tmdbId: 550,
    title: 'Fight Club',
    overview: 'A ticking-timebomb insomniac and a slippery soap salesman channel male deviancy into a shocking new form of therapy. Their concept catches on, with underground fight clubs forming in every town, until an eccentric gets in the way and ignites a spiral out of control.',
    posterPath: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=500',
    backdropPath: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?q=80&w=1280',
    releaseDate: '1999-10-15',
    runtime: 139,
    rating: 4.6,
    language: 'en',
    genres: ['Drama', 'Thriller'],
    status: MovieStatus.NOW_SHOWING,
  },
  {
    tmdbId: 120,
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    overview: 'Young Hobbit Frodo Baggins, after inheriting a mysterious Ring from his uncle Bilbo, must leave his home and journey to the Land of Mordor to destroy the Dark Lord Sauron\'s ultimate weapon.',
    posterPath: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=500',
    backdropPath: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1280',
    releaseDate: '2001-12-18',
    runtime: 178,
    rating: 4.9,
    language: 'en',
    genres: ['Adventure', 'Fantasy', 'Action'],
    status: MovieStatus.NOW_SHOWING,
  },
  {
    tmdbId: 1022789,
    title: 'Inside Out 2',
    overview: 'Teenager Riley\'s mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions! Joy, Sadness, Anger, Fear and Disgust aren\'t sure how to feel when Anxiety shows up.',
    posterPath: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?q=80&w=500',
    backdropPath: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?q=80&w=1280',
    releaseDate: '2024-06-11',
    runtime: 96,
    rating: 4.5,
    language: 'en',
    genres: ['Animation', 'Family', 'Comedy', 'Drama'],
    status: MovieStatus.NOW_SHOWING,
  },
  {
    tmdbId: 533535,
    title: 'Deadpool & Wolverine',
    overview: 'A listless Wade Wilson toils in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.',
    posterPath: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=80&w=500',
    backdropPath: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1280',
    releaseDate: '2024-07-24',
    runtime: 128,
    rating: 4.4,
    language: 'en',
    genres: ['Action', 'Comedy', 'Science Fiction'],
    status: MovieStatus.UPCOMING,
  }
];

export class MovieService {
  private static get apiKey() {
    return process.env.TMDB_API_KEY || '';
  }

  /**
   * Helper to make TMDB requests
   */
  private static async fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
    if (!this.apiKey) {
      throw new Error('TMDB_API_KEY is not configured');
    }

    const queryParams = new URLSearchParams({
      api_key: this.apiKey,
      language: 'en-US',
      ...params,
    });

    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error(`TMDB API call failed: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Sync a movie from TMDB into Postgres DB
   */
  public static async syncMovie(tmdbId: number, status: MovieStatus = MovieStatus.NOW_SHOWING) {
    try {
      if (!this.apiKey) {
        // Find in mock data
        const mock = MOCK_MOVIES.find(m => m.tmdbId === tmdbId);
        if (!mock) throw new Error(`Movie with TMDB ID ${tmdbId} not found in mocks`);
        
        return await prisma.movie.upsert({
          where: { tmdbId },
          update: {
            ...mock,
            releaseDate: new Date(mock.releaseDate),
            status,
          },
          create: {
            ...mock,
            releaseDate: new Date(mock.releaseDate),
            status,
          },
        });
      }

      const details = await this.fetchFromTMDB(`/movie/${tmdbId}`);
      const genres = details.genres?.map((g: any) => g.name) || [];

      return await prisma.movie.upsert({
        where: { tmdbId },
        update: {
          title: details.title,
          overview: details.overview || '',
          posterPath: details.poster_path,
          backdropPath: details.backdrop_path,
          releaseDate: details.release_date ? new Date(details.release_date) : null,
          runtime: details.runtime,
          rating: details.vote_average || 0.0,
          language: details.original_language || 'en',
          genres,
          status,
        },
        create: {
          tmdbId,
          title: details.title,
          overview: details.overview || '',
          posterPath: details.poster_path,
          backdropPath: details.backdrop_path,
          releaseDate: details.release_date ? new Date(details.release_date) : null,
          runtime: details.runtime,
          rating: details.vote_average || 0.0,
          language: details.original_language || 'en',
          genres,
          status,
        },
      });
    } catch (e: any) {
      console.error(`[MovieService.syncMovie] Error syncing TMDB ID ${tmdbId}:`, e.message);
      throw e;
    }
  }

  /**
   * Get trending movies
   */
  public static async getTrending(page: number = 1) {
    if (!this.apiKey) {
      // Return local db movies or mocks
      const dbMovies = await prisma.movie.findMany();
      if (dbMovies.length > 0) return dbMovies;
      return MOCK_MOVIES;
    }

    try {
      const data = await this.fetchFromTMDB('/trending/movie/week', { page: String(page) });
      const synced = [];
      for (const item of data.results.slice(0, 10)) {
        try {
          const movie = await this.syncMovie(item.id, MovieStatus.NOW_SHOWING);
          synced.push(movie);
        } catch {
          // Skip failures
        }
      }
      return synced.length > 0 ? synced : prisma.movie.findMany();
    } catch (e) {
      return prisma.movie.findMany();
    }
  }

  /**
   * Get now playing movies
   */
  public static async getNowPlaying(page: number = 1) {
    if (!this.apiKey) {
      const dbMovies = await prisma.movie.findMany({ where: { status: MovieStatus.NOW_SHOWING } });
      if (dbMovies.length > 0) return dbMovies;
      return MOCK_MOVIES.filter(m => m.status === MovieStatus.NOW_SHOWING);
    }

    try {
      const data = await this.fetchFromTMDB('/movie/now_playing', { page: String(page) });
      const synced = [];
      for (const item of data.results.slice(0, 10)) {
        try {
          const movie = await this.syncMovie(item.id, MovieStatus.NOW_SHOWING);
          synced.push(movie);
        } catch {
          // Skip
        }
      }
      return synced.length > 0 ? synced : prisma.movie.findMany({ where: { status: MovieStatus.NOW_SHOWING } });
    } catch (e) {
      return prisma.movie.findMany({ where: { status: MovieStatus.NOW_SHOWING } });
    }
  }

  /**
   * Get upcoming movies
   */
  public static async getUpcoming(page: number = 1) {
    if (!this.apiKey) {
      const dbMovies = await prisma.movie.findMany({ where: { status: MovieStatus.UPCOMING } });
      if (dbMovies.length > 0) return dbMovies;
      return MOCK_MOVIES.filter(m => m.status === MovieStatus.UPCOMING);
    }

    try {
      const data = await this.fetchFromTMDB('/movie/upcoming', { page: String(page) });
      const synced = [];
      for (const item of data.results.slice(0, 10)) {
        try {
          const movie = await this.syncMovie(item.id, MovieStatus.UPCOMING);
          synced.push(movie);
        } catch {
          // Skip
        }
      }
      return synced.length > 0 ? synced : prisma.movie.findMany({ where: { status: MovieStatus.UPCOMING } });
    } catch (e) {
      return prisma.movie.findMany({ where: { status: MovieStatus.UPCOMING } });
    }
  }

  /**
   * Search movies
   */
  public static async searchMovies(query: string, page: number = 1) {
    if (!query) return [];
    
    if (!this.apiKey) {
      // Mock filter
      return MOCK_MOVIES.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
    }

    try {
      const data = await this.fetchFromTMDB('/search/movie', { query, page: String(page) });
      const results = [];
      for (const item of data.results.slice(0, 10)) {
        try {
          const movie = await this.syncMovie(item.id);
          results.push(movie);
        } catch {
          // Skip
        }
      }
      return results;
    } catch (e) {
      // Local DB search
      return prisma.movie.findMany({
        where: {
          title: {
            contains: query,
            mode: 'insensitive',
          },
        },
      });
    }
  }

  /**
   * Get single movie details
   */
  public static async getMovieDetails(id: string) {
    // 1. Fetch from DB
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!movie) {
      throw new Error('Movie not found');
    }

    return movie;
  }

  /**
   * Create or update a movie review and recalculate average rating
   */
  public static async createReview(userId: string, movieId: string, rating: number, content: string) {
    const review = await prisma.review.upsert({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
      update: {
        rating,
        content,
      },
      create: {
        userId,
        movieId,
        rating,
        content,
      },
    });

    const allReviews = await prisma.review.findMany({
      where: { movieId },
      select: { rating: true },
    });

    const averageRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

    await prisma.movie.update({
      where: { id: movieId },
      data: { rating: averageRating },
    });

    return review;
  }

  /**
   * Smart Movie Recommendation Engine:
   * Combines user ratings history + social graph + movie similarity + theatre availability.
   */
  public static async getSmartRecommendations(userId: string, limit = 10) {
    // 1. Get user's watched/logged movies (from reviews and diary)
    const [userReviews, userDiary] = await Promise.all([
      prisma.review.findMany({ where: { userId } }),
      prisma.movieDiary.findMany({ where: { userId } }),
    ]);

    const watchedMovieIds = new Set([
      ...userReviews.map((r) => r.movieId),
      ...userDiary.map((d) => d.movieId),
    ]);

    // 2. Determine user's preferred genres (from highly-rated reviews)
    const highlyRatedReviews = userReviews.filter((r) => r.rating >= 4.0);
    const favoriteGenres = new Set<string>();

    if (highlyRatedReviews.length > 0) {
      // Find movies corresponding to these reviews
      const highRatedMovieIds = highlyRatedReviews.map((r) => r.movieId);
      const highRatedMovies = await prisma.movie.findMany({
        where: { id: { in: highRatedMovieIds } },
        select: { genres: true },
      });
      for (const m of highRatedMovies) {
        if (m.genres) {
          m.genres.forEach((genre) => favoriteGenres.add(genre));
        }
      }
    }

    // 3. Find movies liked by followed users (social graph recommendations)
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    const friendsHighlyRatedReviews = followingIds.length > 0
      ? await prisma.review.findMany({
          where: {
            userId: { in: followingIds },
            rating: { gte: 4.0 },
          },
          select: { movieId: true, userId: true },
        })
      : [];

    // Map movieId to list of friends who liked it
    const friendLikesMap = new Map<string, string[]>();
    for (const r of friendsHighlyRatedReviews) {
      if (!friendLikesMap.has(r.movieId)) {
        friendLikesMap.set(r.movieId, []);
      }
      friendLikesMap.get(r.movieId)!.push(r.userId);
    }

    // 4. Retrieve movies with upcoming show times (theatre availability)
    const futureShows = await prisma.show.findMany({
      where: {
        startTime: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      },
      select: { movieId: true },
      distinct: ['movieId'],
    });
    const showingMovieIds = new Set(futureShows.map((s) => s.movieId));

    // 5. Get all movies in DB to evaluate recommendation scores
    const allMovies = await prisma.movie.findMany();

    const scoredMovies = allMovies
      // Filter out movies the user has already watched/logged
      .filter((movie) => !watchedMovieIds.has(movie.id))
      .map((movie) => {
        let score = (movie.rating ?? 0.0) * 10; // Base score out of 50

        // Genre match bonus (+20 per matching genre)
        if (movie.genres) {
          movie.genres.forEach((genre) => {
            if (favoriteGenres.has(genre)) {
              score += 20;
            }
          });
        }

        // Social bonus (+15 per friend who rated >= 4.0)
        const friendsWhoLiked = friendLikesMap.get(movie.id) || [];
        score += friendsWhoLiked.length * 15;

        // Theatre availability bonus (+30 if currently showing)
        if (showingMovieIds.has(movie.id)) {
          score += 30;
        }

        return {
          movie,
          score,
          reasons: {
            genreMatch: movie.genres ? movie.genres.filter((g) => favoriteGenres.has(g)) : [],
            friendLikesCount: friendsWhoLiked.length,
            currentlyShowing: showingMovieIds.has(movie.id),
          },
        };
      });

    // Sort by recommendation score descending
    scoredMovies.sort((a, b) => b.score - a.score);

    return scoredMovies.slice(0, limit);
  }
}
