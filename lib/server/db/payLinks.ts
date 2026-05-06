import "server-only";
import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "./client";
import { payLinks, type PayLinkRow } from "./schema";

export function findActivePayLink(
  userId: number,
  customerId: string,
): PayLinkRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(payLinks)
    .where(
      and(
        eq(payLinks.userId, userId),
        eq(payLinks.customerId, customerId),
        gt(payLinks.expiresAt, Date.now()),
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
  userId: number;
  customerId: string;
  expiresAt: number;
}): void {
  const db = getDb();
  db.insert(payLinks)
    .values({
      ...input,
      createdAt: Date.now(),
    })
    .run();
}
