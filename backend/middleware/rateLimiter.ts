import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const requestStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (now > record.resetTime) {
      requestStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const authRateLimiter = (maxRequests = 15, windowMs = 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
    const key = `${clientIp}:${req.path}`;
    const now = Date.now();

    const record = requestStore.get(key);

    if (!record || now > record.resetTime) {
      requestStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (record.count >= maxRequests) {
      const remainingSeconds = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        message: `Too many authentication attempts. Please try again in ${remainingSeconds} seconds.`
      });
    }

    record.count++;
    next();
  };
};
