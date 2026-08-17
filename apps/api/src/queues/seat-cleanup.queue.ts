import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../lib/redis.js';
import { prisma, ShowSeatStatus } from '@repo/database';
import { releaseSeatLocks } from '../lib/redis-lock.js';
import { io } from '../index.js'; // Import global socket instance to broadcast changes

interface SeatCleanupJobData {
  showId: string;
  seatIds: string[];
  userId: string;
}

const QUEUE_NAME = 'seat-cleanup';

// Initialize BullMQ Queue
export const seatCleanupQueue = new Queue<SeatCleanupJobData>(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});

// Helper to schedule a cleanup check
export async function scheduleSeatCleanup(showId: string, seatIds: string[], userId: string, delayMs: number) {
  await seatCleanupQueue.add(
    `cleanup-${showId}-${userId}-${Date.now()}`,
    { showId, seatIds, userId },
    { delay: delayMs }
  );
}

// Initialize Worker to process cleanup
export const seatCleanupWorker = new Worker<SeatCleanupJobData>(
  QUEUE_NAME,
  async (job: Job<SeatCleanupJobData>) => {
    const { showId, seatIds, userId } = job.data;
    
    console.log(`Processing seat lock expiration check for show ${showId}, user ${userId}, seats count: ${seatIds.length}`);

    // Fetch seats that are still locked by this user
    const lockedSeats = await prisma.showSeat.findMany({
      where: {
        showId,
        id: { in: seatIds },
        status: ShowSeatStatus.LOCKED,
        lockedById: userId,
      },
    });

    if (lockedSeats.length === 0) {
      console.log('All seats already checked out or unlocked.');
      return;
    }

    const actualSeatIdsToUnlock = lockedSeats.map(s => s.id);

    // 1. Revert PostgreSQL states to AVAILABLE
    await prisma.showSeat.updateMany({
      where: {
        id: { in: actualSeatIdsToUnlock },
      },
      data: {
        status: ShowSeatStatus.AVAILABLE,
        lockedAt: null,
        lockedById: null,
      },
    });

    // 2. Clear Redis Lock keys
    await releaseSeatLocks(showId, actualSeatIdsToUnlock, userId);

    console.log(`Successfully released ${actualSeatIdsToUnlock.length} expired seat locks`);

    // 3. Broadcast real-time seat status update via Socket.IO
    if (io) {
      io.to(`room:show:${showId}`).emit('seatsUnlocked', {
        showId,
        seatIds: actualSeatIdsToUnlock,
      });
    }
  },
  { connection: redis }
);

seatCleanupWorker.on('completed', (job) => {
  console.log(`Job seat-cleanup ${job.id} completed successfully`);
});

seatCleanupWorker.on('failed', (job, err) => {
  console.error(`Job seat-cleanup ${job?.id} failed:`, err);
});
