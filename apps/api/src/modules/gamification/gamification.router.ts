import { Router } from 'express';
import { GamificationController } from './gamification.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router: Router = Router();

router.get('/stats', authenticate, GamificationController.getUserStats);
router.get('/leaderboard', authenticate, GamificationController.getLeaderboard);

export default router;
