import { Router } from 'express';
import { notificationController } from './notifications.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router: Router = Router();
router.use(authenticate);

router.get('/', notificationController.list.bind(notificationController));
router.get('/unread-count', notificationController.unreadCount.bind(notificationController));
router.patch('/:id/read', notificationController.markRead.bind(notificationController));
router.patch('/read-all', notificationController.markAllRead.bind(notificationController));

export default router;
