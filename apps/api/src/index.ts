import express, { Request, Response } from 'express'; // Force restart to clear rate limit
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { prisma } from '@repo/database';
import { redis } from './lib/redis.js';
import { seatCleanupQueue } from './queues/seat-cleanup.queue.js';
import { refundQueue } from './queues/refund.queue.js';
import { paymentWebhookWorker } from './queues/payment-webhook.queue.js';

// Routers
import authRouter from './modules/auth/auth.router.js';
import movieRouter from './modules/movies/movies.router.js';
import theatreRouter from './modules/theatres/theatres.router.js';
import bookingRouter from './modules/bookings/bookings.router.js';
import socialRouter from './modules/social/social.router.js';
import watchpartyRouter from './modules/watchparty/watchparty.router.js';
import gamificationRouter from './modules/gamification/gamification.router.js';
import aiRouter from './modules/ai/ai.router.js';
import notificationRouter from './modules/notifications/notifications.router.js';
import searchRouter from './modules/search/search.router.js';
import adminRouter from './modules/admin/admin.router.js';
import ownerRouter from './modules/owner/owner.router.js';

// Middleware
import {
  requestIdMiddleware,
  responseTimeMiddleware,
  errorHandler,
  logger,
} from './middleware/observability.middleware.js';
import {
  rateLimiter,
  authRateLimiter,
  securityHeaders,
  sanitizeInput,
} from './middleware/security.middleware.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// ── Global Middleware ────────────────────────────────────────────
app.use(requestIdMiddleware);
app.use(responseTimeMiddleware);
app.use(securityHeaders);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({
  limit: '5mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(sanitizeInput);
app.use(morgan('dev'));
app.use(rateLimiter(200, 60_000));   // 200 req/min global

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/movies', movieRouter);
app.use('/api/theatres', theatreRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/social', socialRouter);
app.use('/api/watchparty', watchpartyRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/ai', aiRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/search', searchRouter);
app.use('/api/admin', adminRouter);
app.use('/api/owner', ownerRouter);

// ── Health Endpoints ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/deep', async (_req, res) => {
  const checks: Record<string, string> = {};

  // PostgreSQL check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Redis check
  try {
    const pong = await redis.ping();
    checks.redis = pong === 'PONG' ? 'ok' : 'error';
  } catch {
    checks.redis = 'error';
  }

  // BullMQ queues check
  try {
    const [seatWaiting, refundWaiting] = await Promise.all([
      seatCleanupQueue.getWaitingCount(),
      refundQueue.getWaitingCount(),
    ]);
    checks.bullmq = 'ok';
    checks.bullmq_seat_cleanup_waiting = String(seatWaiting);
    checks.bullmq_refund_waiting = String(refundWaiting);
  } catch {
    checks.bullmq = 'error';
  }

  const coreHealthy = checks.database === 'ok' && checks.redis === 'ok' && checks.bullmq === 'ok';
  res.status(coreHealthy ? 200 : 503).json({
    status: coreHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// ── Socket.IO ────────────────────────────────────────────────────
io.on('connection', (socket) => {
  logger.info('Socket connected', { socketId: socket.id });

  socket.on('joinShowRoom', ({ showId }) => {
    socket.join(`room:show:${showId}`);
  });

  socket.on('leaveShowRoom', ({ showId }) => {
    socket.leave(`room:show:${showId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Socket disconnected', { socketId: socket.id });
  });
});

// ── Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info(`CineVerse API running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV });
  
  // Ensure the payment webhook worker is running
  if (paymentWebhookWorker) {
    logger.info('Payment Webhook Worker initialized and listening to queue');
  }
});
