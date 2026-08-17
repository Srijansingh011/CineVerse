import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { SocialService } from './social.service.js';
import { TasteService } from './taste.service.js';
import { MovieNightPlannerService } from './planner.service.js';

export class SocialController {
  // ==========================================
  // SOCIAL GRAPH
  // ==========================================

  public static async followUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const followerId = req.user!.id;
      const { id: followingId } = req.params;

      if (!followerId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!followingId) {
        res.status(400).json({ status: 'error', message: 'User ID to follow is required' });
        return;
      }

      const follow = await SocialService.followUser(followerId, followingId);
      res.json({ status: 'success', data: follow });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message || 'Failed to follow user' });
    }
  }

  public static async unfollowUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const followerId = req.user!.id;
      const { id: followingId } = req.params;

      if (!followerId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!followingId) {
        res.status(400).json({ status: 'error', message: 'User ID to unfollow is required' });
        return;
      }

      await SocialService.unfollowUser(followerId, followingId);
      res.json({ status: 'success', message: 'Unfollowed successfully' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message || 'Failed to unfollow user' });
    }
  }

  public static async getFollowers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const list = await SocialService.getFollowers(id as string);
      res.json({ status: 'success', data: list });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async getFollowing(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const list = await SocialService.getFollowing(id as string);
      res.json({ status: 'success', data: list });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async getActivityFeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const feed = await SocialService.getActivityFeed(userId);
      res.json({ status: 'success', data: feed });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  // ==========================================
  // WATCHLIST
  // ==========================================

  public static async toggleWatchlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { movieId } = req.body;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!movieId) {
        res.status(400).json({ status: 'error', message: 'movieId is required' });
        return;
      }

      const result = await SocialService.toggleWatchlist(userId, movieId);
      res.json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async getWatchlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const list = await SocialService.getWatchlist(userId);
      res.json({ status: 'success', data: list });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  // ==========================================
  // MOVIE DIARY
  // ==========================================

  public static async addDiaryEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { movieId, rating, watchedAt, isRewatch } = req.body;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!movieId) {
        res.status(400).json({ status: 'error', message: 'movieId is required' });
        return;
      }

      const entry = await SocialService.addDiaryEntry(
        userId,
        movieId,
        rating ? parseFloat(rating) : null,
        watchedAt ? new Date(watchedAt) : new Date(),
        !!isRewatch
      );

      res.status(201).json({ status: 'success', data: entry });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async getDiary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const list = await SocialService.getDiary(userId);
      res.json({ status: 'success', data: list });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  // ==========================================
  // REVIEWS & RATINGS
  // ==========================================

  public static async createOrUpdateReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { movieId, rating, content, comfortRating, soundRating, screenRating } = req.body;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!movieId || rating === undefined || content === undefined) {
        res.status(400).json({ status: 'error', message: 'movieId, rating, and content are required' });
        return;
      }

      const review = await SocialService.createOrUpdateReview(
        userId,
        movieId,
        parseFloat(rating),
        content,
        comfortRating ? parseFloat(comfortRating) : 0.0,
        soundRating ? parseFloat(soundRating) : 0.0,
        screenRating ? parseFloat(screenRating) : 0.0
      );

      res.json({ status: 'success', data: review });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async deleteReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await SocialService.deleteReview(userId, id as string);
      res.json({ status: 'success', message: 'Review deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async likeReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const reviewId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await SocialService.likeReview(userId, reviewId);
      res.json({ status: 'success', message: 'Review liked successfully' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async unlikeReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const reviewId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await SocialService.unlikeReview(userId, reviewId);
      res.json({ status: 'success', message: 'Review unliked successfully' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async addComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const reviewId = req.params.id as string;
      const { content } = req.body;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!content) {
        res.status(400).json({ status: 'error', message: 'Comment content is required' });
        return;
      }

      const comment = await SocialService.addComment(userId, reviewId, content);
      res.json({ status: 'success', data: comment });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  // ==========================================
  // CUSTOM USER LISTS
  // ==========================================

  public static async createList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, description, isPublic } = req.body;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!name) {
        res.status(400).json({ status: 'error', message: 'List name is required' });
        return;
      }

      const list = await SocialService.createList(userId, name, description, isPublic !== false);
      res.status(201).json({ status: 'success', data: list });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async addMovieToList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const listId = req.params.id as string;
      const { movieId } = req.body;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!movieId) {
        res.status(400).json({ status: 'error', message: 'movieId is required' });
        return;
      }

      const listMovie = await SocialService.addMovieToList(userId, listId, movieId);
      res.status(201).json({ status: 'success', data: listMovie });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async removeMovieFromList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const listId = req.params.id as string;
      const movieId = req.params.movieId as string;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await SocialService.removeMovieFromList(userId, listId, movieId);
      res.json({ status: 'success', message: 'Movie removed from list' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async reorderList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const listId = req.params.id as string;
      const { movieIdsOrdered } = req.body;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!movieIdsOrdered || !Array.isArray(movieIdsOrdered)) {
        res.status(400).json({ status: 'error', message: 'movieIdsOrdered array is required' });
        return;
      }

      await SocialService.reorderList(userId, listId, movieIdsOrdered);
      res.json({ status: 'success', message: 'List reordered successfully' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async getListDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const list = await SocialService.getListDetails(id as string);
      if (!list) {
        res.status(404).json({ status: 'error', message: 'List not found' });
        return;
      }

      res.json({ status: 'success', data: list });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  // ==========================================
  // TASTE COMPATIBILITY & ANALYTICS
  // ==========================================

  public static async calculateSimilarity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userAId = req.user!.id;
      const targetUserId = req.params.targetUserId as string;

      if (!userAId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const match = await TasteService.calculateSimilarity(userAId, targetUserId);
      res.json({ status: 'success', data: match });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async getUserAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const analytics = await TasteService.getUserAnalytics(id as string);
      res.json({ status: 'success', data: analytics });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  // ==========================================
  // MOVIE NIGHT PLANNER
  // ==========================================

  public static async planMovieNight(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { friendIds, cityId, maxPrice, startTimeMin } = req.body;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!friendIds || !Array.isArray(friendIds) || !cityId || !maxPrice) {
        res.status(400).json({ status: 'error', message: 'friendIds array, cityId, and maxPrice are required' });
        return;
      }

      const plan = await MovieNightPlannerService.planMovieNight(
        userId,
        friendIds,
        cityId,
        parseFloat(maxPrice),
        startTimeMin ? new Date(startTimeMin) : new Date()
      );

      res.json({ status: 'success', data: plan });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
}
