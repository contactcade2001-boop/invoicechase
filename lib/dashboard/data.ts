import "server-only";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { auditEvents, paidInvoices, payments } from "@/lib/server/db/schema";
import { computeCurrentDso, getBaselineDso } from "@/lib/server/insights/dso";
import { getDashboardData as getQboDashboardData } from "@/lib/server/qbo/sync";
import type {
  ActivityItem,
  CollectedSummary,
  DashboardData,
  DsoSummary,
  OverdueInvoice,
  Period,
  TrendPoint,
} from "./types";
import { getMockDashboardData } from "./mock";

/**
 * Single entry point for the owner dashboard. Orchestrates real services
 * (DSO, collection totals, QBO sync) and falls back to mock data only
 * when an org has no activity yet, so a brand-new owner sees a shaped
 * screen instead of zeroes. `isMock: true` flows out in the payload so
 * the UI can surface that hint.
 */
const DAY = 86_400_000;

const PERIOD_DAYS: Record<Period, number> = {
  week: 7,
  month: 30,
  quarter: 90,
};
const PERIOD_LABEL: Record<Period, string> = {
  week: "This week",
  month: "This month",
  quarter: "This quarter",
};

export async function getDashboardData({
  organizationId,
  period,
}: {
  organizationId: number;
  period: Period;
}): Promise<DashboardData> {
  const windowDays = PERIOD_DAYS[period];
  const now = Date.now();
  const from = now - windowDays * DAY;
  const priorFrom = from - windowDays * DAY;

  const collected = await loadCollected({ organizationId, from, now, priorFrom, period });
  const dso = loadDso(organizationId);
  const overdue = await loadOverdue(organizationId);
  const trend = loadTrend({ organizationId, days: 30, now });
  const activity = loadActivity(organizationId);

  // If the org genuinely has no signal at all yet, return the shaped
  // mock so the screen looks alive during evaluation. The instant any
  // real number arrives we flip to real.
  const empty =
    collected.totalCents === 0 &&
    collected.paidInvoiceCount === 0 &&
    overdue.length === 0 &&
    activity.length === 0;
  if (empty) {
    return getMockDashboardData(period);
  }

  return {
    isMock: false,
    period,
    collected,
    dso,
    overdue,
    trend,
    activity,
  };
}

/* ───── Collected (current period + delta vs prior) ────────────────── */

async function loadCollected(input: {
  organizationId: number;
  from: number;
  now: number;
  priorFrom: number;
  period: Period;
}): Promise<CollectedSummary> {
  const db = getDb();
  const sumRow = (start: number, end: number) =>
    db
      .select({
        total: sql<number>`COALESCE(SUM(${paidInvoices.amountCents}), 0)`.as(
          "total",
        ),
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(paidInvoices)
      .where(
        and(
          eq(paidInvoices.organizationId, input.organizationId),
          gte(paidInvoices.paidAt, start),
          lte(paidInvoices.paidAt, end),
        ),
      )
      .get();
  const cur = sumRow(input.from, input.now);
  const prior = sumRow(input.priorFrom, input.from);
  const total = Number(cur?.total ?? 0);
  const priorTotal = Number(prior?.total ?? 0);
  const delta =
    priorTotal > 0
      ? {
          pct: Math.round(((total - priorTotal) / priorTotal) * 100),
          direction:
            total > priorTotal
              ? ("up" as const)
              : total < priorTotal
                ? ("down" as const)
                : ("flat" as const),
        }
      : { pct: null, direction: "flat" as const };
  return {
    totalCents: total,
    paidInvoiceCount: Number(cur?.count ?? 0),
    delta,
    periodLabel: PERIOD_LABEL[input.period],
  };
}

/* ───── DSO ──────────────────────────────────────────────────────── */

function loadDso(organizationId: number): DsoSummary {
  const current = computeCurrentDso(organizationId, 30);
  const baseline = getBaselineDso(organizationId);
  const baselineDays = baseline?.dsoDays ?? null;
  return {
    currentDays: current.dsoDays,
    baselineDays,
    improvementDays:
      baselineDays != null && current.paidInvoiceCount > 0
        ? baselineDays - current.dsoDays
        : null,
  };
}

/* ───── Overdue ─────────────────────────────────────────────────── */

async function loadOverdue(
  organizationId: number,
): Promise<OverdueInvoice[]> {
  // Lean on QBO sync — it already aggregates open invoices per customer
  // with daysLate + phone. Cap at 8 so the dashboard stays glanceable;
  // /customers shows the full list.
  const data = await getQboDashboardData(organizationId);
  if (!data.connected) return [];
  const overdue = data.customers
    .filter((c) => c.daysLate > 0 && c.amountOwed > 0)
    .sort((a, b) => b.amountOwed - a.amountOwed)
    .slice(0, 8)
    .map((c) => ({
      customerId: c.id,
      customerName: c.name,
      amountCents: c.amountOwed,
      daysLate: c.daysLate,
      hasPhone: !!c.phone && c.phone.trim().length > 0,
    }));
  return overdue;
}

/* ───── Trend (daily collected over last 30d) ───────────────────── */

function loadTrend(input: {
  organizationId: number;
  days: number;
  now: number;
}): TrendPoint[] {
  const db = getDb();
  const start = input.now - input.days * DAY;
  const rows = db
    .select({
      paidAt: paidInvoices.paidAt,
      amount: paidInvoices.amountCents,
    })
    .from(paidInvoices)
    .where(
      and(
        eq(paidInvoices.organizationId, input.organizationId),
        gte(paidInvoices.paidAt, start),
        lte(paidInvoices.paidAt, input.now),
      ),
    )
    .all();
  // Bucket by ISO date.
  const buckets = new Map<string, number>();
  for (let i = input.days - 1; i >= 0; i--) {
    const d = new Date(input.now - i * DAY);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const iso = new Date(r.paidAt).toISOString().slice(0, 10);
    buckets.set(iso, (buckets.get(iso) ?? 0) + Number(r.amount));
  }
  return Array.from(buckets.entries()).map(([dateIso, totalCents]) => ({
    dateIso,
    totalCents,
  }));
}

/* ───── Activity (most-recent N events) ─────────────────────────── */

function loadActivity(organizationId: number): ActivityItem[] {
  const db = getDb();
  const rows = db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.organizationId, organizationId))
    .orderBy(sql`${auditEvents.createdAt} DESC`)
    .limit(12)
    .all();

  // Surface the kinds owners care about; collapse the rest.
  const visible: ActivityItem[] = [];
  for (const r of rows) {
    const item = mapAudit(r as { kind: string; metadataJson: string | null; createdAt: number; id: number });
    if (item) visible.push(item);
    if (visible.length >= 8) break;
  }
  // Add a payments roll-up so even quiet days show "X paid today".
  // Payments table is the source of truth for actual receipts.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todays = db
    .select({
      count: sql<number>`COUNT(*)`.as("count"),
      total: sql<number>`COALESCE(SUM(${payments.amountCents}), 0)`.as(
        "total",
      ),
    })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organizationId),
        eq(payments.status, "succeeded"),
        gte(payments.paidAt, todayStart.getTime()),
      ),
    )
    .get();
  if (todays && Number(todays.count) > 0) {
    visible.unshift({
      id: `payments-today-${todayStart.getTime()}`,
      kind: "payment",
      headline: `${fmtUsd(Number(todays.total))} paid today`,
      subtitle: `${Number(todays.count)} payments settled`,
      occurredAt: Date.now(),
    });
  }
  return visible.slice(0, 8);
}

function mapAudit(r: {
  id: number;
  kind: string;
  metadataJson: string | null;
  createdAt: number;
}): ActivityItem | null {
  const meta = r.metadataJson
    ? (JSON.parse(r.metadataJson) as Record<string, unknown>)
    : {};
  if (r.kind === "sms.text_sent") {
    return {
      id: String(r.id),
      kind: "reminder_sent",
      headline: "Reminder sent",
      subtitle: typeof meta.name === "string" ? String(meta.name) : "Customer",
      occurredAt: r.createdAt,
    };
  }
  if (r.kind === "email.reminder_sent") {
    return {
      id: String(r.id),
      kind: "reminder_sent",
      headline: "Email reminder sent",
      subtitle: typeof meta.name === "string" ? String(meta.name) : "Customer",
      occurredAt: r.createdAt,
    };
  }
  if (r.kind === "report.weekly_sent") {
    return {
      id: String(r.id),
      kind: "reminder_sent",
      headline: "Weekly report delivered",
      subtitle: typeof meta.weekKey === "string" ? String(meta.weekKey) : "",
      occurredAt: r.createdAt,
    };
  }
  return null;
}

function fmtUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
