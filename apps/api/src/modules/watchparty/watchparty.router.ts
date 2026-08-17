import { Router } from 'express';
import { WatchPartyController } from './watchparty.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router: Router = Router();

// Adjacent Seats
router.get('/seats/adjacent', authenticate, WatchPartyController.findAdjacentSeats);

// Split Payments
router.post('/booking/split', authenticate, WatchPartyController.createSplitPaymentBooking);
router.post('/booking/split/:splitPaymentId/pay', authenticate, WatchPartyController.paySplitShare);
router.post('/booking/split/cleanup', WatchPartyController.releaseExpiredSplits);

// Core Party Details & Creation
router.post('/', authenticate, WatchPartyController.createParty);
router.get('/:id', authenticate, WatchPartyController.getPartyDetails);
router.post('/:id/invite', authenticate, WatchPartyController.inviteUser);
router.post('/:id/leave', authenticate, WatchPartyController.leaveParty);
router.post('/:id/suggest', authenticate, WatchPartyController.suggestMovie);
router.get('/:id/votes', authenticate, WatchPartyController.getVotes);
router.post('/:id/select-show', authenticate, WatchPartyController.selectMovieShow);

export default router;
