import "server-only";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "./client";
import { payLinks, type PayLinkRow } from "./schema";

export function markPayLinkViewed(token: string): void {
  getDb()
    .update(payLinks)
    .set({
      viewedAt: Date.now(),
      viewedCount: sql`${payLinks.viewedCount} + 1`,
    })
    .where(eq(payLinks.token, token))
    .run();
}

export function findActivePayLink(
  organizationId: number,
  customerId: string,
): PayLinkRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(payLinks)
    .where(
      and(
        eq(payLinks.organizationId, organizationId),
        eq(payLinks.customerId, customerId),
        gt(payLinks.expiresAt, Date.now()),
        isNull(payLinks.amountCentsOverride),
      ),
    )
    .orderBy(desc(payLinks.createdAt))
    .limit(1)
    .get();
  return row ?? null;
}

export function findPayLinkByToken(token: string): PayLinkRow | null {
  const db = getDb();
  const row = db.select().from(payLinks).where(eq(payLinks.token, token)).get();
  return row ?? null;
}

export function insertPayLink(input: {
  token: string;
  organizationId: number;
  customerId: string;
  expiresAt: number;
  amountCentsOverride?: number;
}): void {
  const db = getDb();
  db.insert(payLinks)
    .values({
      token: input.token,
      organizationId: input.organizationId,
      customerId: input.customerId,
      expiresAt: input.expiresAt,
      amountCentsOverride: input.amountCentsOverride ?? null,
      createdAt: Date.now(),
    })
    .run();
}
