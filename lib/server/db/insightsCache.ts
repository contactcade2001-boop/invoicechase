import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "./client";
import { insightsCache } from "./schema";

export type InsightKind = "plays" | "patterns";

export type CachedInsight<T = unknown> = {
  payload: T;
  generatedAt: number;
};

export function readCachedInsight<T>(
  organizationId: number,
  kind: InsightKind,
): CachedInsight<T> | null {
  const row = getDb()
    .select({
      payload: insightsCache.payload,
      generatedAt: insightsCache.generatedAt,
    })
    .from(insightsCache)
    .where(
      and(
        eq(insightsCache.organizationId, organizationId),
        eq(insightsCache.kind, kind),
      ),
    )
    .get();
  if (!row) return null;
  try {
    return {
      payload: JSON.parse(row.payload) as T,
      generatedAt: row.generatedAt,
    };
  } catch {
    return null;
  }
}

export function writeCachedInsight<T>(
  organizationId: number,
  kind: InsightKind,
  payload: T,
): void {
  const now = Date.now();
  const serialized = JSON.stringify(payload);
  getDb()
    .insert(insightsCache)
    .values({
      organizationId,
      kind,
      payload: serialized,
      generatedAt: now,
    })
    .onConflictDoUpdate({
      target: [insightsCache.organizationId, insightsCache.kind],
      set: { payload: serialized, generatedAt: now },
    })
    .run();
}
