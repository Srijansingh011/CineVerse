import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { GamificationService } from './gamification.service.js';

export class GamificationController {
  /**
   * Get user stats, levels, badges, and challenge progressions
   */
  public static async getUserStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const stats = await GamificationService.getUserStats(userId);
      res.status(200).json({ status: 'success', data: stats });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Get global or friend XP leaderboard
   */
  public static async getLeaderboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const scope = (req.query.scope as 'global' | 'friends') || 'global';
      const leaderboard = await GamificationService.getLeaderboard(userId, scope);
      res.status(200).json({ status: 'success', data: leaderboard });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
}
