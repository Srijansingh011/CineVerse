import { Request, Response } from 'express';
import { notificationService } from './notifications.service.js';

export class NotificationController {
  async list(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await notificationService.list(userId, page, limit);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async unreadCount(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const count = await notificationService.unreadCount(userId);
      return res.json({ success: true, data: { count } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async markRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      await notificationService.markRead(id as string, userId);
      return res.json({ success: true, message: 'Marked as read' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async markAllRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      await notificationService.markAllRead(userId);
      return res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const notificationController = new NotificationController();
