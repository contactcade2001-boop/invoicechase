import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { dsoSnapshots } from "./schema";

export type DsoSnapshotRow = {
  id: number;
  organizationId: number;
  kind: "baseline" | "rolling";
  windowDays: number;
  dsoDays: number;
  paidInvoiceCount: number;
  totalCollectedCents: number;
  capturedAt: number;
};

export type DsoSnapshotInput = {
  organizationId: number;
  kind: "baseline" | "rolling";
  windowDays: number;
  dsoDays: number;
  paidInvoiceCount: number;
  totalCollectedCents: number;
};

export function recordDsoSnapshot(input: DsoSnapshotInput): DsoSnapshotRow {
  const db = getDb();
  const row = db
    .insert(dsoSnapshots)
    .values({
      ...input,
      capturedAt: Date.now(),
    })
    .returning()
    .get();
  return row as unknown as DsoSnapshotRow;
}

/** Returns the org's baseline (oldest baseline row). One per org by convention. */
export function getBaselineSnapshot(
  organizationId: number,
): DsoSnapshotRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(dsoSnapshots)
    .where(
      and(
        eq(dsoSnapshots.organizationId, organizationId),
        eq(dsoSnapshots.kind, "baseline"),
      ),
    )
    .orderBy(desc(dsoSnapshots.capturedAt))
    .get();
  return (row ?? null) as unknown as DsoSnapshotRow | null;
}

export function listRollingSnapshots(
  organizationId: number,
  limit = 30,
): DsoSnapshotRow[] {
  const db = getDb();
  return db
    .select()
    .from(dsoSnapshots)
    .where(
      and(
        eq(dsoSnapshots.organizationId, organizationId),
        eq(dsoSnapshots.kind, "rolling"),
      ),
    )
    .orderBy(desc(dsoSnapshots.capturedAt))
    .limit(limit)
    .all() as unknown as DsoSnapshotRow[];
}
