import { Request, Response, NextFunction } from 'express';
import { redisClient, isRedisAvailable } from '../config/redis';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  message?: string;
}

// In-memory fallback when Redis is unavailable
const memoryCounters = new Map<string, { count: number; expiresAt: number }>();

/**
 * Rate limiter with Redis backend and in-memory fallback.
 * Gracefully degrades when Redis is unavailable.
 */
export function rateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyPrefix = 'rl',
    message = 'Too many requests, please try again later.',
  } = options;

  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;

    try {
      let current: number;

      if (isRedisAvailable()) {
        current = await redisClient.incr(key);
        if (current === 1) {
          await redisClient.expire(key, windowSeconds);
        }
      } else {
        // In-memory fallback
        const now = Date.now();
        const entry = memoryCounters.get(key);
        if (!entry || now > entry.expiresAt) {
          memoryCounters.set(key, { count: 1, expiresAt: now + windowMs });
          current = 1;
        } else {
          entry.count++;
          current = entry.count;
        }
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

      if (current > maxRequests) {
        return res.status(429).json({
          error: 'Rate Limit Exceeded',
          message,
          retryAfter: windowSeconds,
        });
      }

      next();
    } catch {
      // If anything fails, let the request through (fail-open)
      next();
    }
  };
}

/** Strict rate limiter for auth endpoints: 10 attempts per minute */
export const authRateLimiter = rateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
  keyPrefix: 'rl:auth',
  message: 'Too many login attempts. Please wait 1 minute.',
});

/** General API rate limiter: 200 requests per minute */
export const apiRateLimiter = rateLimiter({
  windowMs: 60_000,
  maxRequests: 200,
  keyPrefix: 'rl:api',
});
