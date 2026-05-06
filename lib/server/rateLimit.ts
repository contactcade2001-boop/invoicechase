import "server-only";

const buckets = new Map<string, number[]>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const cutoff = now - windowMs;
  const arr = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (arr.length >= max) {
    buckets.set(key, arr);
    const oldest = arr[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, windowMs - (now - oldest)),
    };
  }
  arr.push(now);
  buckets.set(key, arr);
  return {
    allowed: true,
    remaining: max - arr.length,
    retryAfterMs: 0,
  };
}

// Test/utility helper: clear all buckets.
export function _resetRateLimit(): void {
  buckets.clear();
}

// Predefined limits used across the app.
export const LIMITS = {
  smsPerMinute: { max: 10, windowMs: 60_000 },
  smsPerHour: { max: 60, windowMs: 60 * 60_000 },
  bulkSmsPerMinute: { max: 1, windowMs: 60_000 },
  payLinkPerMinute: { max: 60, windowMs: 60_000 },
} as const;
