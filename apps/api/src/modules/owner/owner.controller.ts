import { Request, Response } from 'express';
import { ownerService } from './owner.service.js';

export class OwnerController {
  async listMyTheatres(req: Request, res: Response) {
    try {
      const ownerId = (req as any).user.id;
      const data = await ownerService.listMyTheatres(ownerId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async listScreens(req: Request, res: Response) {
    try {
      const ownerId = (req as any).user.id;
      const theatreId = req.params.theatreId as string;
      const data = await ownerService.listScreens(theatreId, ownerId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.message.includes('unauthorized') ? 403 : 500)
        .json({ success: false, message: err.message });
    }
  }

  async listMyShows(req: Request, res: Response) {
    try {
      const ownerId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await ownerService.listMyShows(ownerId, page, limit);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async listMyBookings(req: Request, res: Response) {
    try {
      const ownerId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await ownerService.listMyBookings(ownerId, page, limit);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const ownerId = (req as any).user.id;
      const data = await ownerService.getRevenueAnalytics(ownerId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const ownerController = new OwnerController();
