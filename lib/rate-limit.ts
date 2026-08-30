// In-memory rate limiting implementation for Next.js API Routes

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

/**
 * Basic in-memory rate limiter
 * @param ip Client IP address to rate limit
 * @param limit Max number of requests allowed in window
 * @param windowMs Window duration in milliseconds (e.g. 1 minute)
 * @returns { success: boolean, count: number, remaining: number, resetTime: number }
 */
export function rateLimit(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = memoryStore.get(ip);

  if (!record || now > record.resetTime) {
    const newRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    memoryStore.set(ip, newRecord);
    return {
      success: true,
      count: 1,
      remaining: limit - 1,
      resetTime: newRecord.resetTime,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, limit - record.count);

  if (record.count > limit) {
    return {
      success: false,
      count: record.count,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  return {
    success: true,
    count: record.count,
    remaining,
    resetTime: record.resetTime,
  };
}

// Cleanup expired memoryStore records every 10 minutes to prevent leak
if (typeof global !== 'undefined') {
  const g = global as any;
  if (!g._rateLimitInterval) {
    g._rateLimitInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, val] of memoryStore.entries()) {
        if (now > val.resetTime) {
          memoryStore.delete(key);
        }
      }
    }, 10 * 60 * 1000);
  }
}
