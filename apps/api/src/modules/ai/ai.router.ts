import { Router } from 'express';
import { AIController } from './ai.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router: Router = Router();

router.post('/chat', authenticate, AIController.chat);
router.post('/summary/:movieId', authenticate, AIController.generateSummary);

export default router;
