import { Request, Response } from 'express';
import { adminService } from './admin.service.js';

export class AdminController {
  // Users
  async listUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const data = await adminService.listUsers(page, limit, search);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateUserRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminId = (req as any).user.id;
      const user = await adminService.updateUserRole(id as string, role);
      await adminService.createAuditLog({
        userId: adminId, action: 'UPDATE_ROLE',
        resource: 'User', resourceId: id,
        metadata: { role },
        ipAddress: req.ip, userAgent: req.get('user-agent'),
      });
      res.json({ success: true, data: user });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;
      await adminService.deleteUser(id as string);
      await adminService.createAuditLog({
        userId: adminId, action: 'DELETE_USER',
        resource: 'User', resourceId: id,
        ipAddress: req.ip, userAgent: req.get('user-agent'),
      });
      res.json({ success: true, message: 'User deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Theatres
  async listTheatres(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await adminService.listTheatres(page, limit);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Movies
  async listMovies(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const data = await adminService.listMovies(page, limit, search);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateMovieStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await adminService.updateMovieStatus(id as string, status);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Reviews
  async listReviews(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await adminService.listReviews(page, limit);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;
      await adminService.deleteReview(id as string);
      await adminService.createAuditLog({
        userId: adminId, action: 'DELETE_REVIEW',
        resource: 'Review', resourceId: id,
        ipAddress: req.ip, userAgent: req.get('user-agent'),
      });
      res.json({ success: true, message: 'Review deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Analytics
  async getAnalytics(req: Request, res: Response) {
    try {
      const data = await adminService.getPlatformAnalytics();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Audit logs
  async getAuditLogs(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const action = req.query.action as string;
      const data = await adminService.getAuditLogs(page, limit, action);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const adminController = new AdminController();
