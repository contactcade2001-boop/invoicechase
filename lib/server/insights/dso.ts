import "server-only";
import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  getBaselineSnapshot,
  recordDsoSnapshot,
  type DsoSnapshotRow,
} from "../db/dsoSnapshots";
import {
  listPaidInvoicesInRange,
  type PaidInvoiceRow,
} from "../db/paidInvoices";
import { paidInvoices } from "../db/schema";
import {
  computeDsoFromEvents,
  type DsoResult,
  type PaymentEvent,
} from "./dsoMath";

const DAY_MS = 86_400_000;
const DEFAULT_WINDOW_DAYS = 30;

function toEvent(row: PaidInvoiceRow): PaymentEvent {
  return {
    issuedAt: row.issuedAt,
    paidAt: row.paidAt,
    amountCents: row.amountCents,
  };
}

/**
 * Current DSO over a trailing window ending now (default 30 days). Reads
 * directly from the paid_invoices table.
 */
export function computeCurrentDso(
  organizationId: number,
  windowDays = DEFAULT_WINDOW_DAYS,
): DsoResult & { windowDays: number } {
  const now = Date.now();
  const from = now - windowDays * DAY_MS;
  const rows = listPaidInvoicesInRange(organizationId, from, now);
  const result = computeDsoFromEvents(rows.map(toEvent));
  return { ...result, windowDays };
}

/**
 * Returns the baseline snapshot if it exists, otherwise null. The
 * baseline is captured once on connect and never overwritten.
 */
export function getBaselineDso(
  organizationId: number,
): DsoSnapshotRow | null {
  return getBaselineSnapshot(organizationId);
}

/**
 * Persist a baseline snapshot. Called by the on-connect backfill — see
 * lib/server/insights/dsoBackfill.ts. If a baseline already exists for
 * the org, returns it without overwriting; baselines are immutable so
 * before/after comparisons stay honest.
 */
export function ensureBaselineDso(
  organizationId: number,
  events: PaymentEvent[],
  windowDays = 90,
): DsoSnapshotRow {
  const existing = getBaselineSnapshot(organizationId);
  if (existing) return existing;
  const computed = computeDsoFromEvents(events);
  return recordDsoSnapshot({
    organizationId,
    kind: "baseline",
    windowDays,
    dsoDays: computed.dsoDays,
    paidInvoiceCount: computed.paidInvoiceCount,
    totalCollectedCents: computed.totalCollectedCents,
  });
}

/**
 * Capture a rolling DSO snapshot — typically called by cron daily so we
 * can chart trend over time.
 */
export function captureRollingSnapshot(
  organizationId: number,
  windowDays = DEFAULT_WINDOW_DAYS,
): DsoSnapshotRow {
  const current = computeCurrentDso(organizationId, windowDays);
  return recordDsoSnapshot({
    organizationId,
    kind: "rolling",
    windowDays,
    dsoDays: current.dsoDays,
    paidInvoiceCount: current.paidInvoiceCount,
    totalCollectedCents: current.totalCollectedCents,
  });
}

export type CollectionTotals = {
  totalCollectedCents: number;
  paidInvoiceCount: number;
  attributedCents: number;
  attributedCount: number;
};

/**
 * Total dollars + the attributed slice for the org over a date range.
 * Attributed = paid invoice rows where a reminder/AI reply preceded the
 * payment (we set attributedReminderId at insert time).
 */
export function getCollectionTotals(
  organizationId: number,
  fromTs: number,
  toTs: number,
): CollectionTotals {
  const db = getDb();
  const all = db
    .select({
      total: sql<number>`COALESCE(SUM(${paidInvoices.amountCents}), 0)`.as(
        "total",
      ),
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(paidInvoices)
    .where(
      and(
        eq(paidInvoices.organizationId, organizationId),
        gte(paidInvoices.paidAt, fromTs),
        lte(paidInvoices.paidAt, toTs),
      ),
    )
    .get();

  const attributed = db
    .select({
      total: sql<number>`COALESCE(SUM(${paidInvoices.amountCents}), 0)`.as(
        "total",
      ),
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(paidInvoices)
    .where(
      and(
        eq(paidInvoices.organizationId, organizationId),
        gte(paidInvoices.paidAt, fromTs),
        lte(paidInvoices.paidAt, toTs),
        isNotNull(paidInvoices.attributedReminderId),
      ),
    )
    .get();

  return {
    totalCollectedCents: Number(all?.total ?? 0),
    paidInvoiceCount: Number(all?.count ?? 0),
    attributedCents: Number(attributed?.total ?? 0),
    attributedCount: Number(attributed?.count ?? 0),
  };
}

export type DsoComparison = {
  baseline: DsoSnapshotRow | null;
  current: DsoResult & { windowDays: number };
  /** baseline.dsoDays − current.dsoDays. Positive means we improved. */
  improvementDays: number | null;
};

export function getBaselineVsCurrent(
  organizationId: number,
  windowDays = DEFAULT_WINDOW_DAYS,
): DsoComparison {
  const baseline = getBaselineDso(organizationId);
  const current = computeCurrentDso(organizationId, windowDays);
  const improvementDays =
    baseline && current.paidInvoiceCount > 0
      ? baseline.dsoDays - current.dsoDays
      : null;
  return { baseline, current, improvementDays };
}
