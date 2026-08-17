import { prisma } from '@repo/database';
import { GamificationService } from '../gamification/gamification.service.js';
import { AIService } from '../ai/ai.service.js';

export class SocialService {
  // ==========================================
  // SOCIAL GRAPH (FOLLOWS)
  // ==========================================

  public static async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('You cannot follow yourself');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // Upsert/Create Follow link
    const follow = await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      create: {
        followerId,
        followingId,
      },
      update: {},
    });

    return follow;
  }

  public static async unfollowUser(followerId: string, followingId: string) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return true;
  }

  public static async getFollowers(userId: string) {
    return await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  public static async getFollowing(userId: string) {
    return await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  public static async getActivityFeed(userId: string, limit = 20) {
    // Get list of followed users
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    if (followingIds.length === 0) return [];

    // Fetch recent reviews, lists, and diary logs
    const [reviews, diary, lists] = await Promise.all([
      prisma.review.findMany({
        where: { userId: { in: followingIds } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { id: true, name: true } },
          movie: { select: { id: true, title: true, posterPath: true } },
        },
      }),
      prisma.movieDiary.findMany({
        where: { userId: { in: followingIds } },
        orderBy: { watchedAt: 'desc' },
        take: limit,
        include: {
          user: { select: { id: true, name: true } },
          movie: { select: { id: true, title: true, posterPath: true } },
        },
      }),
      prisma.userList.findMany({
        where: { userId: { in: followingIds }, isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { id: true, name: true } },
          movies: {
            include: {
              movie: { select: { id: true, title: true, posterPath: true } },
            },
          },
        },
      }),
    ]);

    // Merge and sort all feeds by date
    const feed = [
      ...reviews.map((r) => ({ type: 'REVIEW', id: r.id, data: r, date: r.createdAt })),
      ...diary.map((d) => ({ type: 'DIARY', id: d.id, data: d, date: d.watchedAt })),
      ...lists.map((l) => ({ type: 'LIST', id: l.id, data: l, date: l.createdAt })),
    ];

    return feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
  }

  // ==========================================
  // WATCHLIST
  // ==========================================

  public static async toggleWatchlist(userId: string, movieId: string) {
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });

    if (existing) {
      await prisma.watchlist.delete({
        where: {
          userId_movieId: {
            userId,
            movieId,
          },
        },
      });
      return { inWatchlist: false };
    } else {
      await prisma.watchlist.create({
        data: {
          userId,
          movieId,
        },
      });
      return { inWatchlist: true };
    }
  }

  public static async getWatchlist(userId: string) {
    return await prisma.watchlist.findMany({
      where: { userId },
      include: {
        movie: true,
      },
    });
  }

  // ==========================================
  // MOVIE DIARY
  // ==========================================

  public static async addDiaryEntry(
    userId: string,
    movieId: string,
    rating: number | null,
    watchedAt: Date,
    isRewatch: boolean
  ) {
    const entry = await prisma.movieDiary.create({
      data: {
        userId,
        movieId,
        rating,
        watchedAt,
        isRewatch,
      },
      include: {
        movie: true,
      },
    });

    // Gamification Hook: Award XP and increment challenge progress
    try {
      await GamificationService.addXp(userId, 15);
      await GamificationService.incrementProgress(userId, 'WATCH_MOVIES', 1);
    } catch (gErr) {
      console.error('Error in diary entry gamification hook:', gErr);
    }

    return entry;
  }

  public static async getDiary(userId: string) {
    return await prisma.movieDiary.findMany({
      where: { userId },
      orderBy: { watchedAt: 'desc' },
      include: {
        movie: true,
      },
    });
  }

  // ==========================================
  // REVIEWS & RATINGS
  // ==========================================

  public static async createOrUpdateReview(
    userId: string,
    movieId: string,
    rating: number,
    content: string,
    comfortRating = 0.0,
    soundRating = 0.0,
    screenRating = 0.0
  ) {
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
        comfortRating,
        soundRating,
        screenRating,
      },
      create: {
        userId,
        movieId,
        rating,
        content,
        comfortRating,
        soundRating,
        screenRating,
      },
    });

    // Recalculate movie average rating
    await this.updateMovieRating(movieId);

    // AI Hook: Generate/update AI review summary
    try {
      await AIService.generateReviewSummary(movieId);
    } catch (aiErr) {
      console.error('Error generating AI review summary on review save:', aiErr);
    }

    // Gamification Hook: Award XP and update challenge progress
    try {
      await GamificationService.addXp(userId, 25);
      await GamificationService.incrementProgress(userId, 'WRITE_REVIEWS', 1);
      
      // If user rated sound quality, award Sound Expert badge
      if (soundRating > 0) {
        await GamificationService.awardBadge(userId, 'Sound Expert');
      }
    } catch (gErr) {
      console.error('Error in review gamification hook:', gErr);
    }

    return review;
  }

  public static async deleteReview(userId: string, reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new Error('Review not found');
    if (review.userId !== userId) throw new Error('Unauthorized');

    await prisma.review.delete({
      where: { id: reviewId },
    });

    await this.updateMovieRating(review.movieId);
    return true;
  }

  private static async updateMovieRating(movieId: string) {
    const aggregations = await prisma.review.aggregate({
      where: { movieId },
      _avg: {
        rating: true,
      },
    });

    const averageRating = aggregations._avg.rating || 0.0;

    await prisma.movie.update({
      where: { id: movieId },
      data: {
        rating: parseFloat(averageRating.toFixed(1)),
      },
    });
  }

  public static async likeReview(userId: string, reviewId: string) {
    return await prisma.reviewLike.create({
      data: {
        userId,
        reviewId,
      },
    });
  }

  public static async unlikeReview(userId: string, reviewId: string) {
    await prisma.reviewLike.delete({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });
    return true;
  }

  public static async addComment(userId: string, reviewId: string, content: string) {
    return await prisma.reviewComment.create({
      data: {
        userId,
        reviewId,
        content,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  // ==========================================
  // CUSTOM USER LISTS
  // ==========================================

  public static async createList(
    userId: string,
    name: string,
    description: string | null,
    isPublic: boolean
  ) {
    return await prisma.userList.create({
      data: {
        userId,
        name,
        description,
        isPublic,
      },
    });
  }

  public static async addMovieToList(userId: string, listId: string, movieId: string) {
    const list = await prisma.userList.findUnique({
      where: { id: listId },
    });

    if (!list) throw new Error('List not found');
    if (list.userId !== userId) throw new Error('Unauthorized');

    const maxPos = await prisma.userListMovie.aggregate({
      where: { listId },
      _max: { position: true },
    });

    const position = (maxPos._max.position ?? -1) + 1;

    return await prisma.userListMovie.create({
      data: {
        listId,
        movieId,
        position,
      },
      include: {
        movie: true,
      },
    });
  }

  public static async removeMovieFromList(userId: string, listId: string, movieId: string) {
    const list = await prisma.userList.findUnique({
      where: { id: listId },
    });

    if (!list) throw new Error('List not found');
    if (list.userId !== userId) throw new Error('Unauthorized');

    await prisma.userListMovie.delete({
      where: {
        listId_movieId: {
          listId,
          movieId,
        },
      },
    });

    return true;
  }

  public static async reorderList(userId: string, listId: string, movieIdsOrdered: string[]) {
    const list = await prisma.userList.findUnique({
      where: { id: listId },
    });

    if (!list) throw new Error('List not found');
    if (list.userId !== userId) throw new Error('Unauthorized');

    // Run reordering inside a single Postgres transaction
    await prisma.$transaction(
      movieIdsOrdered.map((movieId, index) =>
        prisma.userListMovie.update({
          where: {
            listId_movieId: {
              listId,
              movieId,
            },
          },
          data: {
            position: index,
          },
        })
      )
    );

    return true;
  }

  public static async getListDetails(listId: string) {
    return await prisma.userList.findUnique({
      where: { id: listId },
      include: {
        user: { select: { id: true, name: true } },
        movies: {
          orderBy: { position: 'asc' },
          include: {
            movie: true,
          },
        },
      },
    });
  }
}
