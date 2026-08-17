import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { AIService } from './ai.service.js';

export class AIController {
  /**
   * Post message to the AI movie assistant
   */
  public static async chat(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const { message, history } = req.body;
      if (!message) {
        res.status(400).json({ status: 'error', message: 'message is required' });
        return;
      }

      const response = await AIService.chatWithMovieAssistant(userId, message, history || []);
      res.status(200).json({ status: 'success', data: { reply: response } });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Trigger review summary generation for a movie
   */
  public static async generateSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { movieId } = req.params;
      if (!movieId) {
        res.status(400).json({ status: 'error', message: 'movieId is required' });
        return;
      }

      const summary = await AIService.generateReviewSummary(movieId);
      res.status(200).json({ status: 'success', data: { summary } });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }
}
