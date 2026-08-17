import { Router } from 'express';
import { ownerController } from './owner.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router: Router = Router();
router.use(authenticate);
router.use(authorize(['THEATRE_OWNER', 'ADMIN', 'SUPER_ADMIN'] as any));

router.get('/theatres', ownerController.listMyTheatres.bind(ownerController));
router.get('/theatres/:theatreId/screens', ownerController.listScreens.bind(ownerController));
router.get('/shows', ownerController.listMyShows.bind(ownerController));
router.get('/bookings', ownerController.listMyBookings.bind(ownerController));
router.get('/analytics', ownerController.getAnalytics.bind(ownerController));

export default router;
