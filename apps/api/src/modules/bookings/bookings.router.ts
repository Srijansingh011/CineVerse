import { Router } from 'express';

import { BookingController } from './bookings.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { expressRaw } from '../../middleware/raw-body.middleware.js';

const router: Router = Router();

/*
 * Razorpay webhook
 *
 * MUST be before authenticate.
 * Razorpay does not have our JWT.
 */
router.post(
  '/webhook',
  expressRaw({
    type: 'application/json',
    limit: '5mb',
  }),
  BookingController.handleWebhook
);

/*
 * All normal booking routes require authentication.
 */
router.use(authenticate);

router.post(
  '/lock',
  BookingController.lockSeats
);

router.post(
  '/unlock',
  BookingController.unlockSeats
);

router.post(
  '/',
  BookingController.createBooking
);

router.post(
  '/confirm-payment',
  BookingController.confirmPayment
);

router.get(
  '/:id',
  BookingController.getBooking
);

router.post(
  '/:id/cancel',
  BookingController.cancelBooking
);

export default router;
