import "server-only";
import { and, eq, gte, lt } from "drizzle-orm";
import { getDb } from "../db/client";
import { payments } from "../db/schema";

export type RecoveryStats = {
  thisMonthCents: number;
  lastMonthCents: number;
  /** % change vs last month. Positive = up. */
  deltaPct: number | null;
  thisMonthCount: number;
  lastMonthCount: number;
};

function monthBounds(offsetMonths: number): { start: number; end: number } {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth() + offsetMonths,
    1,
    0,
    0,
    0,
    0,
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + offsetMonths + 1,
    1,
    0,
    0,
    0,
    0,
  );
  return { start: start.getTime(), end: end.getTime() };
}

export function getRecoveryStats(orgId: number): RecoveryStats {
  const db = getDb();
  const thisMonth = monthBounds(0);
  const lastMonth = monthBounds(-1);

  function sum(start: number, end: number) {
    const rows = db
      .select({ amount: payments.amountCents })
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, orgId),
          eq(payments.status, "succeeded"),
          gte(payments.paidAt, start),
          lt(payments.paidAt, end),
        ),
      )
      .all();
    return {
      total: rows.reduce((s, r) => s + r.amount, 0),
      count: rows.length,
    };
  }

  const a = sum(thisMonth.start, thisMonth.end);
  const b = sum(lastMonth.start, lastMonth.end);
  const delta =
    b.total > 0
      ? ((a.total - b.total) / b.total) * 100
      : a.total > 0
        ? 100
        : null;

  return {
    thisMonthCents: a.total,
    lastMonthCents: b.total,
    deltaPct: delta,
    thisMonthCount: a.count,
    lastMonthCount: b.count,
  };
}
