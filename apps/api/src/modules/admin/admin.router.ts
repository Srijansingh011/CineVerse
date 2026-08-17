import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router: Router = Router();

// All admin routes require authentication + ADMIN or SUPER_ADMIN role
router.use(authenticate);
router.use(authorize(['ADMIN', 'SUPER_ADMIN'] as any));

// Users
router.get('/users', adminController.listUsers.bind(adminController));
router.patch('/users/:id/role', adminController.updateUserRole.bind(adminController));
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

// Theatres
router.get('/theatres', adminController.listTheatres.bind(adminController));

// Movies
router.get('/movies', adminController.listMovies.bind(adminController));
router.patch('/movies/:id/status', adminController.updateMovieStatus.bind(adminController));

// Reviews
router.get('/reviews', adminController.listReviews.bind(adminController));
router.delete('/reviews/:id', adminController.deleteReview.bind(adminController));

// Analytics
router.get('/analytics', adminController.getAnalytics.bind(adminController));

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs.bind(adminController));

export default router;
