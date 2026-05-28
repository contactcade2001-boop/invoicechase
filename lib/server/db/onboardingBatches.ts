import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "./client";
import {
  onboardingFirstBatches,
  onboardingFirstBatchItems,
} from "./schema";

export type FirstBatchRow = {
  id: number;
  organizationId: number;
  status: "draft" | "approved" | "sending" | "complete" | "cancelled";
  totalAtRiskCents: number;
  eligibleCount: number;
  skippedCount: number;
  approvedAt: number | null;
  approvedByUserId: number | null;
  createdAt: number;
};

export type FirstBatchItemRow = {
  id: number;
  batchId: number;
  organizationId: number;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  amountCents: number;
  status: "queued" | "sent" | "skipped" | "failed";
  skipReason: string | null;
  sentAt: number | null;
  reminderId: number | null;
  createdAt: number;
};

export function getBatchForOrg(orgId: number): FirstBatchRow | null {
  const db = getDb();
  return (
    (db
      .select()
      .from(onboardingFirstBatches)
      .where(eq(onboardingFirstBatches.organizationId, orgId))
      .get() ?? null) as FirstBatchRow | null
  );
}

export function getBatchById(id: number): FirstBatchRow | null {
  const db = getDb();
  return (
    (db
      .select()
      .from(onboardingFirstBatches)
      .where(eq(onboardingFirstBatches.id, id))
      .get() ?? null) as FirstBatchRow | null
  );
}

export function createDraftBatch(input: {
  organizationId: number;
  totalAtRiskCents: number;
  eligibleCount: number;
  skippedCount: number;
}): FirstBatchRow {
  const db = getDb();
  const row = db
    .insert(onboardingFirstBatches)
    .values({
      organizationId: input.organizationId,
      status: "draft",
      totalAtRiskCents: input.totalAtRiskCents,
      eligibleCount: input.eligibleCount,
      skippedCount: input.skippedCount,
      createdAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: onboardingFirstBatches.organizationId,
      set: {
        status: "draft",
        totalAtRiskCents: input.totalAtRiskCents,
        eligibleCount: input.eligibleCount,
        skippedCount: input.skippedCount,
      },
    })
    .returning()
    .get();
  return row as unknown as FirstBatchRow;
}

export function insertBatchItem(input: {
  batchId: number;
  organizationId: number;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  amountCents: number;
  status: FirstBatchItemRow["status"];
  skipReason: string | null;
}): FirstBatchItemRow {
  const db = getDb();
  const row = db
    .insert(onboardingFirstBatchItems)
    .values({
      ...input,
      createdAt: Date.now(),
    })
    .returning()
    .get();
  return row as unknown as FirstBatchItemRow;
}

export function listBatchItems(batchId: number): FirstBatchItemRow[] {
  const db = getDb();
  return db
    .select()
    .from(onboardingFirstBatchItems)
    .where(eq(onboardingFirstBatchItems.batchId, batchId))
    .orderBy(asc(onboardingFirstBatchItems.id))
    .all() as unknown as FirstBatchItemRow[];
}

export function listQueuedItems(
  batchId: number,
  limit: number,
): FirstBatchItemRow[] {
  const db = getDb();
  return db
    .select()
    .from(onboardingFirstBatchItems)
    .where(
      and(
        eq(onboardingFirstBatchItems.batchId, batchId),
        eq(onboardingFirstBatchItems.status, "queued"),
      ),
    )
    .orderBy(asc(onboardingFirstBatchItems.id))
    .limit(limit)
    .all() as unknown as FirstBatchItemRow[];
}

export function markBatchStatus(
  id: number,
  status: FirstBatchRow["status"],
  approvedByUserId?: number,
): void {
  const db = getDb();
  db.update(onboardingFirstBatches)
    .set({
      status,
      approvedAt:
        status === "approved" || status === "sending" ? Date.now() : undefined,
      approvedByUserId,
    })
    .where(eq(onboardingFirstBatches.id, id))
    .run();
}

export function markItemStatus(
  itemId: number,
  status: FirstBatchItemRow["status"],
  patch: {
    skipReason?: string | null;
    sentAt?: number | null;
    reminderId?: number | null;
  } = {},
): void {
  const db = getDb();
  db.update(onboardingFirstBatchItems)
    .set({
      status,
      skipReason: patch.skipReason ?? null,
      sentAt: patch.sentAt ?? null,
      reminderId: patch.reminderId ?? null,
    })
    .where(eq(onboardingFirstBatchItems.id, itemId))
    .run();
}
