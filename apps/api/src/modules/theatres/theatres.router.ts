import { Router } from 'express';
import { TheatreController } from './theatres.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { Role } from '@repo/database';

const router: Router = Router();

// Public routes
router.get('/cities', TheatreController.getCities);
router.get('/shows/movie/:movieId', TheatreController.getShowsForMovie);
router.get('/shows/:id', TheatreController.getShowDetails);

// Protected routes (THEATRE_OWNER and ADMIN)
router.post(
  '/',
  authenticate,
  authorize([Role.THEATRE_OWNER, Role.ADMIN, Role.SUPER_ADMIN]),
  TheatreController.createTheatre
);

router.get(
  '/my',
  authenticate,
  authorize([Role.THEATRE_OWNER, Role.ADMIN, Role.SUPER_ADMIN]),
  TheatreController.getMyTheatres
);

router.post(
  '/screens',
  authenticate,
  authorize([Role.THEATRE_OWNER, Role.ADMIN, Role.SUPER_ADMIN]),
  TheatreController.createScreen
);

router.post(
  '/shows',
  authenticate,
  authorize([Role.THEATRE_OWNER, Role.ADMIN, Role.SUPER_ADMIN]),
  TheatreController.createShow
);

export default router;
