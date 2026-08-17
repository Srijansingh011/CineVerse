import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../lib/redis.js';
import { prisma } from '@repo/database';

interface RefundJobData {
  bookingId: string;
  refundAmount: number;
}

const QUEUE_NAME = 'refund-processing';

// Initialize BullMQ Queue
export const refundQueue = new Queue<RefundJobData>(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});

// Helper to schedule a refund
export async function scheduleRefund(bookingId: string, refundAmount: number) {
  await refundQueue.add(
    `refund-${bookingId}-${Date.now()}`,
    { bookingId, refundAmount }
  );
}

// Initialize Worker to process refunds
export const refundWorker = new Worker<RefundJobData>(
  QUEUE_NAME,
  async (job: Job<RefundJobData>) => {
    const { bookingId, refundAmount } = job.data;
    
    console.log(`Processing refund job for booking: ${bookingId}, amount: ₹${refundAmount}`);

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      console.error(`Booking ${bookingId} not found for refund`);
      return;
    }

    try {
      // In a real production setup:
      // const refund = await razorpay.payments.refund(booking.paymentId, {
      //   amount: refundAmount * 100, // in paise
      //   notes: { reason: "User cancelled booking" }
      // });
      
      console.log(`Razorpay Refund transaction successful. Simulated refund of ₹${refundAmount} for payment ${booking.paymentId}`);
      
      // Update database or audit logs if needed
    } catch (err) {
      console.error(`Failed to process Razorpay refund:`, err);
      throw err; // Re-throw to fail the BullMQ job and trigger retries
    }
  },
  { connection: redis }
);

refundWorker.on('completed', (job) => {
  console.log(`Job refund ${job.id} completed successfully`);
});

refundWorker.on('failed', (job, err) => {
  console.error(`Job refund ${job?.id} failed:`, err);
});
