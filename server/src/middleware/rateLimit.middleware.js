const { client } = require("../config/redis");

/**
 * RouteX Sliding Window Rate Limiter
 *
 * Implements a dual-mode sliding window rate limiter:
 * 1. Redis Sorted Set (ZSET) when Redis is connected and ready.
 * 2. In-Memory Map fallback with self-cleaning TTL when Redis is offline.
 *
 * Prevents brute-force credential stuffing on authentication endpoints.
 */

// In-memory fallback state
const memoryBuckets = new Map();

// Periodic cleanup of stale in-memory buckets (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of memoryBuckets.entries()) {
    const valid = timestamps.filter((t) => now - t < 300000);
    if (valid.length === 0) {
      memoryBuckets.delete(key);
    } else {
      memoryBuckets.set(key, valid);
    }
  }
}, 300000).unref(); // unref so it does not keep process alive during graceful shutdown

function createRateLimiter({
  windowMs = 60000, // 1 minute window
  maxRequests = 10,  // max requests per window
  keyPrefix = "auth",
  message = "Too many authentication attempts. Please try again later.",
} = {}) {
  return async function rateLimiter(req, res, next) {
    const rawIp = req.headers["x-forwarded-for"] || req.ip || req.socket?.remoteAddress || "127.0.0.1";
    const ip = typeof rawIp === "string" ? rawIp.split(",")[0].trim() : "127.0.0.1";
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `ratelimit:${keyPrefix}:${ip}`;

    // Fast path: Redis sliding window using Sorted Set
    if (client.isReady) {
      try {
        const multi = client.multi();
        multi.zRemRangeByScore(redisKey, 0, windowStart);
        multi.zAdd(redisKey, { score: now, value: `${now}:${Math.random().toString(36).slice(2, 8)}` });
        multi.zCard(redisKey);
        multi.expire(redisKey, Math.ceil(windowMs / 1000));
        const results = await multi.exec();

        // results[2] is the output of ZCARD (current number of requests in window)
        const currentCount = typeof results[2] === "number" ? results[2] : Number(results[2]);
        const remaining = Math.max(0, maxRequests - currentCount);

        res.setHeader("X-RateLimit-Limit", maxRequests);
        res.setHeader("X-RateLimit-Remaining", remaining);
        res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));

        if (currentCount > maxRequests) {
          const retryAfterSec = Math.ceil(windowMs / 1000);
          res.setHeader("Retry-After", retryAfterSec);
          return res.status(429).json({
            success: false,
            message: `${message} Retry after ${retryAfterSec} seconds.`,
            retryAfterSeconds: retryAfterSec,
          });
        }

        return next();
      } catch (err) {
        console.warn(`[RateLimit] Redis error for key "${redisKey}", falling back to memory:`, err.message);
      }
    }

    // In-Memory Fallback Path
    const bucketKey = `${keyPrefix}:${ip}`;
    const timestamps = (memoryBuckets.get(bucketKey) || []).filter((t) => t > windowStart);
    timestamps.push(now);
    memoryBuckets.set(bucketKey, timestamps);

    const remaining = Math.max(0, maxRequests - timestamps.length);
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));

    if (timestamps.length > maxRequests) {
      const retryAfterSec = Math.ceil(windowMs / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      return res.status(429).json({
        success: false,
        message: `${message} Retry after ${retryAfterSec} seconds.`,
        retryAfterSeconds: retryAfterSec,
      });
    }

    next();
  };
}

// Pre-configured limiters for sensitive authentication endpoints
const authLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,     // 10 attempts per minute per IP
  keyPrefix: "auth-sensitive",
  message: "Too many authentication requests from this IP.",
});

module.exports = { createRateLimiter, authLimiter };
