import "server-only";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "./db/client";
import { rateLimitEvents } from "./db/schema";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

// Sliding-window limiter persisted to SQLite. Survives process restarts and
// (when the DB is shared) works across multiple instances. Also prunes old
// rows opportunistically each call so the table stays small.
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const db = getDb();
  const cutoff = now - windowMs;

  // Prune anything older than the cutoff for this bucket.
  db.delete(rateLimitEvents)
    .where(and(eq(rateLimitEvents.bucket, key), lt(rateLimitEvents.hitAt, cutoff)))
    .run();

  const current = db
    .select()
    .from(rateLimitEvents)
    .where(and(eq(rateLimitEvents.bucket, key), gt(rateLimitEvents.hitAt, cutoff)))
    .all();

  if (current.length >= max) {
    const oldest = current.reduce(
      (m, r) => (r.hitAt < m ? r.hitAt : m),
      current[0].hitAt,
    );
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, windowMs - (now - oldest)),
    };
  }

  db.insert(rateLimitEvents)
    .values({ bucket: key, hitAt: now })
    .run();

  return {
    allowed: true,
    remaining: max - current.length - 1,
    retryAfterMs: 0,
  };
}

// Test/utility helper: clear all events.
export function _resetRateLimit(): void {
  const db = getDb();
  db.delete(rateLimitEvents).run();
}

// Predefined limits used across the app.
export const LIMITS = {
  smsPerMinute: { max: 10, windowMs: 60_000 },
  smsPerHour: { max: 60, windowMs: 60 * 60_000 },
  bulkSmsPerMinute: { max: 1, windowMs: 60_000 },
  payLinkPerMinute: { max: 60, windowMs: 60_000 },
  // Magic-link generation per email — caps email-bomb / brute-force.
  magicLinkPerHour: { max: 5, windowMs: 60 * 60_000 },
} as const;
