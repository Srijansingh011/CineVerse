import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { TheatreService } from './theatres.service.js';

export class TheatreController {
  public static async createTheatre(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, address, cityId } = req.body;
      const ownerId = req.user!.id;

      if (!ownerId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!name || !address || !cityId) {
        res.status(400).json({ status: 'error', message: 'name, address, and cityId are required' });
        return;
      }

      const theatre = await TheatreService.createTheatre(name, address, cityId, ownerId);
      res.json({ status: 'success', data: theatre });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyTheatres(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.id;
      if (!ownerId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const theatres = await TheatreService.getMyTheatres(ownerId);
      res.json({ status: 'success', data: theatres });
    } catch (error) {
      next(error);
    }
  }

  public static async createScreen(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { theatreId, name, rows, colsCount, tierMapping } = req.body;
      if (!theatreId || !name || !rows || !colsCount) {
        res.status(400).json({ status: 'error', message: 'theatreId, name, rows, and colsCount are required' });
        return;
      }

      const screen = await TheatreService.createScreen(
        theatreId,
        name,
        rows,
        parseInt(colsCount),
        tierMapping || {}
      );
      res.json({ status: 'success', data: screen });
    } catch (error) {
      next(error);
    }
  }

  public static async createShow(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { movieId, screenId, startTime, priceStandard, pricePremium, priceRecliner } = req.body;
      if (!movieId || !screenId || !startTime || priceStandard === undefined || pricePremium === undefined || priceRecliner === undefined) {
        res.status(400).json({ status: 'error', message: 'movieId, screenId, startTime, and prices are required' });
        return;
      }

      const show = await TheatreService.createShow(
        movieId,
        screenId,
        startTime,
        parseFloat(priceStandard),
        parseFloat(pricePremium),
        parseFloat(priceRecliner)
      );
      res.json({ status: 'success', data: show });
    } catch (error) {
      next(error);
    }
  }

  public static async getShowsForMovie(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { movieId } = req.params;
      const { cityId, date } = req.query;

      if (!movieId || !cityId || !date) {
        res.status(400).json({ status: 'error', message: 'movieId, cityId, and date query param are required' });
        return;
      }

      const theatres = await TheatreService.getShowsForMovieInCity(
        movieId,
        cityId as string,
        date as string
      );
      res.json({ status: 'success', data: theatres });
    } catch (error) {
      next(error);
    }
  }

  public static async getShowDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ status: 'error', message: 'Show ID is required' });
        return;
      }

      const show = await TheatreService.getShowDetails(id);
      res.json({ status: 'success', data: show });
    } catch (error) {
      next(error);
    }
  }

  public static async getCities(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cities = await TheatreService.getCities();
      res.json({ status: 'success', data: cities });
    } catch (error) {
      next(error);
    }
  }
}
