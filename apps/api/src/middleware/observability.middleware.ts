import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Attach a unique request ID to every request and response
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// Structured logger — thin wrapper that can be swapped for pino/winston
export const logger = {
  info: (msg: string, meta?: object) =>
    console.log(JSON.stringify({ level: 'info', ts: new Date().toISOString(), msg, ...meta })),
  warn: (msg: string, meta?: object) =>
    console.warn(JSON.stringify({ level: 'warn', ts: new Date().toISOString(), msg, ...meta })),
  error: (msg: string, meta?: object) =>
    console.error(JSON.stringify({ level: 'error', ts: new Date().toISOString(), msg, ...meta })),
};

// Centralized error handler middleware (must be registered last)
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId;
  const statusCode = err.statusCode || err.status || 500;

  logger.error('Unhandled error', {
    requestId,
    statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    requestId,
  });
};

// API response time tracker
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: duration,
        requestId: (req as any).requestId,
      });
    }
  });
  next();
};
