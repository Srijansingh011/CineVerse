import { Queue, Worker, Job } from 'bullmq';
import { redis as connection } from '../lib/redis.js';
import { prisma } from '@repo/database';
import { BookingService } from '../modules/bookings/bookings.service.js';

const QUEUE_NAME = 'payment-webhook';

export const paymentWebhookQueue = new Queue(QUEUE_NAME, { connection });

export const paymentWebhookWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    const { webhookEventId } = job.data;
    const webhookEvent = await prisma.webhookEvent.findUnique({
      where: { id: webhookEventId },
    });

    if (!webhookEvent) {
      throw new Error(`Webhook event not found: ${webhookEventId}`);
    }

    if (webhookEvent.processed) {
      return { status: 'already_processed', webhookEventId };
    }

    try {
      const payload: any = webhookEvent.payload;

      switch (webhookEvent.eventType) {
        case 'payment.captured': {
          const payment = payload?.payload?.payment?.entity;
          const bookingId = payment?.notes?.bookingId || payment?.notes?.booking_id;

          if (bookingId) {
            await BookingService.confirmPaymentFromWebhook(bookingId, payment.id);
            console.log(`Payment confirmed for booking ${bookingId}`);
          }
          break;
        }

        case 'payment.failed': {
          const payment = payload?.payload?.payment?.entity;
          const bookingId = payment?.notes?.bookingId || payment?.notes?.booking_id;
          console.log(`Payment failed for booking ${bookingId}`);
          break;
        }

        case 'refund.processed': {
          const refund = payload?.payload?.refund?.entity;
          const bookingId =
            refund?.notes?.bookingId ||
            refund?.notes?.booking_id;

          if (!bookingId) {
            break;
          }

          /*
           * Keep refund handling conservative here.
           * Your existing cancellation/refund flow owns
           * the booking state transition.
           */
          console.log(
            `Refund processed for booking ${bookingId}`
          );

          break;
        }

        default: {
          console.log(
            `Unhandled Razorpay webhook: ${webhookEvent.eventType}`
          );
        }
      }

      await prisma.webhookEvent.update({
        where: {
          id: webhookEvent.id,
        },
        data: {
          processed: true,
          processedAt: new Date(),
          error: null,
        },
      });

      return {
        status: 'processed',
        webhookEventId,
        eventType: webhookEvent.eventType,
      };
    } catch (error: any) {
      await prisma.webhookEvent.update({
        where: {
          id: webhookEvent.id,
        },
        data: {
          error: error?.message || 'Unknown webhook error',
        },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

paymentWebhookWorker.on(
  'completed',
  (job) => {
    console.log(
      `[payment-webhook] completed ${job.id}`
    );
  }
);

paymentWebhookWorker.on(
  'failed',
  (job, error) => {
    console.error(
      `[payment-webhook] failed ${job?.id}:`,
      error
    );
  }
);
