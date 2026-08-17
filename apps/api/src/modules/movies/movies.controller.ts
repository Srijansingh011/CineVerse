import { Request, Response, NextFunction } from 'express';
import { MovieService } from './movies.service.js';
import { MovieStatus } from '@repo/database';
import { AuthRequest } from '../../middleware/auth.middleware.js';

export class MovieController {
  public static async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const movies = await MovieService.getTrending(page);
      res.json({ status: 'success', data: movies });
    } catch (error) {
      next(error);
    }
  }

  public static async getNowPlaying(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const movies = await MovieService.getNowPlaying(page);
      res.json({ status: 'success', data: movies });
    } catch (error) {
      next(error);
    }
  }

  public static async getUpcoming(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const movies = await MovieService.getUpcoming(page);
      res.json({ status: 'success', data: movies });
    } catch (error) {
      next(error);
    }
  }

  public static async searchMovies(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const movies = await MovieService.searchMovies(query, page);
      res.json({ status: 'success', data: movies });
    } catch (error) {
      next(error);
    }
  }

  public static async getMovieDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ status: 'error', message: 'Movie ID is required' });
        return;
      }
      const movie = await MovieService.getMovieDetails(id);
      res.json({ status: 'success', data: movie });
    } catch (error) {
      next(error);
    }
  }

  public static async syncMovie(req: Request, res: Response, next: NextFunction) {
    try {
      const { tmdbId, status } = req.body;
      if (!tmdbId) {
        res.status(400).json({ status: 'error', message: 'tmdbId is required' });
        return;
      }
      const movieStatus = status === 'UPCOMING' ? MovieStatus.UPCOMING : MovieStatus.NOW_SHOWING;
      const movie = await MovieService.syncMovie(parseInt(tmdbId), movieStatus);
      res.json({ status: 'success', message: 'Movie synced successfully', data: movie });
    } catch (error) {
      next(error);
    }
  }

  public static async createReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: movieId } = req.params;
      const { rating, content } = req.body;
      const userId = req.user!.id;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!movieId) {
        res.status(400).json({ status: 'error', message: 'Movie ID is required' });
        return;
      }

      if (rating === undefined || !content) {
        res.status(400).json({ status: 'error', message: 'rating and content are required' });
        return;
      }

      const review = await MovieService.createReview(userId, movieId, parseFloat(rating), content);
      res.json({ status: 'success', message: 'Review saved successfully', data: review });
    } catch (error) {
      next(error);
    }
  }

  public static async getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const recommendations = await MovieService.getSmartRecommendations(userId, limit);
      res.json({ status: 'success', data: recommendations });
    } catch (error) {
      next(error);
    }
  }
}
