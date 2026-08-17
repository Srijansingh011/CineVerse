import { Request, Response, NextFunction } from 'express';

// Rate limiting store (in-memory; swap for Redis in production)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export const rateLimiter = (maxRequests = 100, windowMs = 60_000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const entry = requestCounts.get(ip);

    if (!entry || now > entry.resetAt) {
      requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
    }

    return next();
  };
};

// Strict rate limiter for auth endpoints
export const authRateLimiter = rateLimiter(100, 60_000); // 100 req/min per IP in dev

// Security headers middleware (lightweight alternative to helmet)
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' https: data:; script-src 'self'; style-src 'self' 'unsafe-inline'",
  );
  next();
};

// Input sanitizer — strips null bytes and trims strings in req.body
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') return obj.replace(/\0/g, '').trim();
      if (Array.isArray(obj)) return obj.map(sanitize);
      if (obj && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, sanitize(v)]),
        );
      }
      return obj;
    };
    req.body = sanitize(req.body);
  }
  next();
};
