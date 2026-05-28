/**
 * MOCK dashboard data. Used when an org has no real activity yet so
 * owners aren't staring at a barren screen during evaluation. Returns
 * the same shape as the real data layer — the UI doesn't need to know.
 *
 * Numbers here are illustrative and clearly marked via `isMock: true` so
 * the UI can surface a hint ("Sample data — connect QuickBooks for real
 * numbers"). NEVER pipe these into outbound messages or reports.
 */

import type {
  ActivityItem,
  DashboardData,
  OverdueInvoice,
  Period,
  TrendPoint,
} from "./types";

const DAY = 86_400_000;

const PERIOD_LABEL: Record<Period, string> = {
  week: "This week",
  month: "This month",
  quarter: "This quarter",
};

function fakeTrend(): TrendPoint[] {
  const out: TrendPoint[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY);
    // Mid-range with weekend dips so the bar chart reads as plausible.
    const weekendDip = d.getDay() === 0 || d.getDay() === 6 ? 0.35 : 1;
    const seasonal =
      0.7 + 0.5 * Math.sin((i / 30) * Math.PI * 2 + Math.PI / 3);
    const noise = 0.7 + Math.random() * 0.6;
    const cents = Math.round(1200_00 * weekendDip * seasonal * noise);
    out.push({
      dateIso: d.toISOString().slice(0, 10),
      totalCents: Math.max(0, cents),
    });
  }
  return out;
}

const OVERDUE: OverdueInvoice[] = [
  {
    customerId: "mock-1",
    customerName: "Riverside Diner",
    amountCents: 420_000,
    daysLate: 47,
    hasPhone: true,
  },
  {
    customerId: "mock-2",
    customerName: "Brown & Co Construction",
    amountCents: 282_500,
    daysLate: 18,
    hasPhone: true,
  },
  {
    customerId: "mock-3",
    customerName: "Lakeside Pediatrics",
    amountCents: 76_500,
    daysLate: 4,
    hasPhone: false,
  },
];

const ACTIVITY: ActivityItem[] = [
  {
    id: "m-act-1",
    kind: "payment",
    headline: "Paid $4,200",
    subtitle: "Acme HVAC · SMS pay link",
    occurredAt: Date.now() - 2 * 60_000,
  },
  {
    id: "m-act-2",
    kind: "ai_reply",
    headline: "AI replied for you",
    subtitle: "Bob's HVAC asked about a 3-week payment plan",
    occurredAt: Date.now() - 62 * 60_000,
  },
  {
    id: "m-act-3",
    kind: "reminder_sent",
    headline: "8 reminders sent",
    subtitle: "Bulk batch · all overdue customers with phone",
    occurredAt: Date.now() - 4 * 60 * 60_000,
  },
  {
    id: "m-act-4",
    kind: "customer_added",
    headline: "Customer synced",
    subtitle: "Cedar Park Schools added from QuickBooks",
    occurredAt: Date.now() - 22 * 60 * 60_000,
  },
];

export function getMockDashboardData(period: Period): DashboardData {
  const collectedThisPeriod =
    period === "week"
      ? 47_230_00
      : period === "month"
        ? 186_500_00
        : 540_000_00;
  return {
    isMock: true,
    period,
    collected: {
      totalCents: collectedThisPeriod,
      paidInvoiceCount: period === "week" ? 14 : period === "month" ? 52 : 168,
      delta: { pct: 23, direction: "up" },
      periodLabel: PERIOD_LABEL[period],
    },
    dso: {
      currentDays: 19,
      baselineDays: 47,
      improvementDays: 28,
    },
    overdue: OVERDUE,
    trend: fakeTrend(),
    activity: ACTIVITY,
  };
}
