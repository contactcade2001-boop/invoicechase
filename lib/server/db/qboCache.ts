import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { qboDashboardCache } from "./schema";

export type QboDashboardCacheEntry = {
  payload: string;
  refreshedAt: number;
};

export function readQboDashboardCache(
  organizationId: number,
): QboDashboardCacheEntry | null {
  const row = getDb()
    .select({
      payload: qboDashboardCache.payload,
      refreshedAt: qboDashboardCache.refreshedAt,
    })
    .from(qboDashboardCache)
    .where(eq(qboDashboardCache.organizationId, organizationId))
    .get();
  return row ?? null;
}

export function writeQboDashboardCache(
  organizationId: number,
  payload: string,
  refreshedAt: number = Date.now(),
): void {
  getDb()
    .insert(qboDashboardCache)
    .values({ organizationId, payload, refreshedAt })
    .onConflictDoUpdate({
      target: qboDashboardCache.organizationId,
      set: { payload, refreshedAt },
    })
    .run();
}

export function invalidateQboDashboardCache(organizationId: number): void {
  getDb()
    .delete(qboDashboardCache)
    .where(eq(qboDashboardCache.organizationId, organizationId))
    .run();
}
