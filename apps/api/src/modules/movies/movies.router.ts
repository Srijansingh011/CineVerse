import { Router } from 'express';
import { MovieController } from './movies.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { Role } from '@repo/database';

const router: Router = Router();

router.get('/trending', MovieController.getTrending);
router.get('/now-playing', MovieController.getNowPlaying);
router.get('/upcoming', MovieController.getUpcoming);
router.get('/search', MovieController.searchMovies);
router.get('/recommendations', authenticate, MovieController.getRecommendations);
router.get('/:id', MovieController.getMovieDetails);
router.post('/:id/reviews', authenticate, MovieController.createReview);

// Sync is restricted to ADMIN and SUPER_ADMIN
router.post('/sync', authenticate, authorize([Role.ADMIN, Role.SUPER_ADMIN]), MovieController.syncMovie);

export default router;
