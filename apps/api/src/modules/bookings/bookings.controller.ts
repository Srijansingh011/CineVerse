import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

import { prisma } from '@repo/database';

import { BookingService } from './bookings.service.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { paymentWebhookQueue } from '../../queues/payment-webhook.queue.js';

export class BookingController {
  /**
   * Lock seats temporarily for checkout.
   */
  public static async lockSeats(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { showId, seatIds } = req.body;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      if (
        !showId ||
        !Array.isArray(seatIds) ||
        seatIds.length === 0
      ) {
        res.status(400).json({
          status: 'error',
          message: 'showId and a non-empty seatIds array are required',
        });
        return;
      }

      const result = await BookingService.lockSeats(
        showId,
        seatIds,
        userId
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: any) {
      if (
        error?.message?.includes('locked') ||
        error?.message?.includes('available')
      ) {
        res.status(409).json({
          status: 'error',
          message: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Manually unlock seats.
   */
  public static async unlockSeats(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { showId, seatIds } = req.body;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      if (!showId || !Array.isArray(seatIds)) {
        res.status(400).json({
          status: 'error',
          message: 'showId and seatIds array are required',
        });
        return;
      }

      await BookingService.unlockSeats(
        showId,
        seatIds,
        userId
      );

      res.status(200).json({
        status: 'success',
        message: 'Seats unlocked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create pending booking.
   */
  public static async createBooking(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { showId, seatIds, idempotencyKey } = req.body;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      if (
        !showId ||
        !Array.isArray(seatIds) ||
        seatIds.length === 0
      ) {
        res.status(400).json({
          status: 'error',
          message: 'showId and seatIds array are required',
        });
        return;
      }

      const booking = await BookingService.createBooking(
        showId,
        seatIds,
        userId,
        idempotencyKey
      );

      res.status(201).json({
        status: 'success',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Explicit frontend payment confirmation endpoint.
   */
  public static async confirmPayment(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        bookingId,
        paymentId,
        signature,
        orderId,
      } = req.body;

      if (!bookingId || !paymentId || !signature) {
        res.status(400).json({
          status: 'error',
          message:
            'bookingId, paymentId, and signature are required',
        });
        return;
      }

      const booking = await BookingService.confirmPayment(
        bookingId,
        paymentId,
        signature,
        orderId
      );

      res.status(200).json({
        status: 'success',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get booking.
   */
  public static async getBooking(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const booking = await BookingService.getBooking(
        id as string,
        userId
      );

      res.status(200).json({
        status: 'success',
        data: booking,
      });
    } catch (error: any) {
      if (error?.message?.includes('Unauthorized')) {
        res.status(403).json({
          status: 'error',
          message:
            'Forbidden: You do not own this booking',
        });
        return;
      }

      if (error?.message?.includes('not found')) {
        res.status(404).json({
          status: 'error',
          message: error.message,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Cancel confirmed booking.
   */
  public static async cancelBooking(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const result = await BookingService.cancelBooking(
        id as string,
        userId
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Razorpay webhook.
   *
   * IMPORTANT:
   * - No JWT authentication.
   * - Signature is verified using the raw request body.
   * - Event is persisted and queued.
   * - Booking processing happens asynchronously.
   */
  public static async handleWebhook(
    req: Request & { rawBody?: Buffer },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature =
        req.headers['x-razorpay-signature'];

      const webhookSecret =
        process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error(
          'RAZORPAY_WEBHOOK_SECRET is not configured'
        );

        res.status(500).json({
          status: 'error',
          message: 'Webhook configuration error',
        });

        return;
      }

      if (
        typeof signature !== 'string' ||
        !req.rawBody
      ) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid webhook request',
        });

        return;
      }

      const expectedSignature =
        crypto
          .createHmac('sha256', webhookSecret)
          .update(req.rawBody)
          .digest('hex');

      const signaturesMatch =
        crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(signature)
        );

      if (!signaturesMatch) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid webhook signature',
        });

        return;
      }

      const event = req.body;

      const eventType = event?.event;

      if (!eventType || !event?.payload) {
        res.status(400).json({
          status: 'error',
          message: 'Malformed webhook payload',
        });

        return;
      }

      /*
       * Razorpay webhook event ID.
       *
       * Depending on the payload/version, make sure the
       * actual event ID field used by your integration is
       * mapped here.
       */
      const eventId =
        event?.id ||
        event?.event_id;

      if (!eventId) {
        res.status(400).json({
          status: 'error',
          message: 'Webhook event ID is missing',
        });

        return;
      }

      let webhookEvent;

      try {
        webhookEvent = await prisma.webhookEvent.create({
          data: {
            provider: 'razorpay',
            eventId,
            eventType: event.event,
            payload: event,
            headers: {
              'x-razorpay-signature': signature,
            },
            processed: false,
          },
        });
      } catch (error: any) {
        /*
         * Prisma P2002 = unique constraint violation.
         *
         * This means Razorpay sent the same webhook again.
         */
        if (error?.code === 'P2002') {
          res.status(200).json({
            status: 'success',
            message: 'Webhook already received',
          });
          return;
        }

        throw error;
      }

      await paymentWebhookQueue.add(
        'process-payment-webhook',
        {
          webhookEventId: webhookEvent.id,
        },
        {
          jobId: webhookEvent.id,
        }
      );

      /*
       * Respond immediately.
       *
       * Actual booking processing happens inside
       * the BullMQ worker.
       */
      res.status(200).json({
        status: 'success',
        message: 'Webhook accepted',
      });
    } catch (error) {
      next(error);
    }
  }
}