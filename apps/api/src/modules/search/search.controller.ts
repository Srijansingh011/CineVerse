import { Request, Response } from 'express';
import { searchService } from './search.service.js';

export class SearchController {
  async search(req: Request, res: Response) {
    try {
      const q = (req.query.q as string) || '';
      const type = (req.query.type as any) || 'all';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await searchService.search(q, type, page, limit);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const searchController = new SearchController();
