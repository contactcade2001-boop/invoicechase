import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { templateStats } from "./schema";

export type TemplateStat = {
  templateKey: string;
  sends: number;
  replies: number;
  paid: number;
  paidCents: number;
};

export function listTemplateStats(orgId: number): TemplateStat[] {
  const db = getDb();
  return db
    .select({
      templateKey: templateStats.templateKey,
      sends: templateStats.sends,
      replies: templateStats.replies,
      paid: templateStats.paid,
      paidCents: templateStats.paidCents,
    })
    .from(templateStats)
    .where(eq(templateStats.organizationId, orgId))
    .orderBy(desc(templateStats.paidCents))
    .all();
}

/** Atomic increment: insert with 1, or update existing row. */
export function recordTemplateEvent(input: {
  organizationId: number;
  templateKey: string;
  event: "send" | "reply" | "paid";
  paidCents?: number;
}): void {
  const db = getDb();
  const now = Date.now();
  const incSends = input.event === "send" ? 1 : 0;
  const incReplies = input.event === "reply" ? 1 : 0;
  const incPaid = input.event === "paid" ? 1 : 0;
  const incPaidCents = input.event === "paid" ? (input.paidCents ?? 0) : 0;

  const existing = db
    .select()
    .from(templateStats)
    .where(
      and(
        eq(templateStats.organizationId, input.organizationId),
        eq(templateStats.templateKey, input.templateKey),
      ),
    )
    .get();

  if (existing) {
    db.update(templateStats)
      .set({
        sends: existing.sends + incSends,
        replies: existing.replies + incReplies,
        paid: existing.paid + incPaid,
        paidCents: existing.paidCents + incPaidCents,
        updatedAt: now,
      })
      .where(
        and(
          eq(templateStats.organizationId, input.organizationId),
          eq(templateStats.templateKey, input.templateKey),
        ),
      )
      .run();
  } else {
    db.insert(templateStats)
      .values({
        organizationId: input.organizationId,
        templateKey: input.templateKey,
        sends: incSends,
        replies: incReplies,
        paid: incPaid,
        paidCents: incPaidCents,
        updatedAt: now,
      })
      .run();
  }
}
