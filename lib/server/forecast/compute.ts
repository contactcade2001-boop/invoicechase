import "server-only";
import type { Customer } from "@/lib/types";
import { getOrgById } from "../db/organizations";
import { getDashboardData } from "../qbo/sync";

export type ForecastWeek = {
  weekStart: string; // ISO date (Monday of that week)
  expectedInflows: number; // cents — collections from open AR
  expectedNewRevenue: number; // cents — extrapolated future invoices
  expectedOutflows: number; // cents — recurring monthly costs spread weekly
  net: number; // cents — inflows + new − outflows
  runningCash: number; // cents — cumulative since week 0
};

export type ForecastResult =
  | { connected: false }
  | {
      connected: true;
      companyName: string;
      weeks: ForecastWeek[];
      totals: {
        inflows: number;
        outflows: number;
        newRevenue: number;
        net: number;
      };
      assumptions: {
        monthlyOutflowCents: number;
        monthlyNewInvoicesCents: number;
        weeksAhead: number;
        repHaircuts: { tier: string; probability: number; week: number }[];
      };
    };

const WEEKS_AHEAD = 13;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

// Reputation tier → (week offset, payment probability)
// Better-rep customers pay sooner and more reliably. Poor-rep customers
// get pushed further out and lose a meaningful chunk of their balance.
type TierRule = {
  minScore: number;
  label: string;
  weekOffset: number;
  probability: number;
};

const TIER_RULES: TierRule[] = [
  { minScore: 800, label: "Excellent", weekOffset: 0, probability: 0.98 },
  { minScore: 740, label: "Strong", weekOffset: 1, probability: 0.95 },
  { minScore: 670, label: "Good", weekOffset: 2, probability: 0.85 },
  { minScore: 580, label: "Fair", weekOffset: 3, probability: 0.65 },
  { minScore: 0, label: "Poor", weekOffset: 4, probability: 0.4 },
];

function tierFor(score: number): TierRule {
  for (const r of TIER_RULES) {
    if (score >= r.minScore) return r;
  }
  return TIER_RULES[TIER_RULES.length - 1];
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  // Monday = 1, Sunday = 0 — anchor to Monday.
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function computeForecast(
  organizationId: number,
): Promise<ForecastResult> {
  const org = getOrgById(organizationId);
  if (!org) return { connected: false };
  const data = await getDashboardData(organizationId);
  if (!data.connected) return { connected: false };

  // Seed empty weekly buckets, week 0 = current week (Monday-aligned).
  const today = new Date();
  const weeks: ForecastWeek[] = [];
  const baseWeek = startOfWeek(today);
  for (let i = 0; i < WEEKS_AHEAD; i++) {
    const ws = new Date(baseWeek.getTime() + i * MS_PER_WEEK);
    weeks.push({
      weekStart: isoDate(ws),
      expectedInflows: 0,
      expectedNewRevenue: 0,
      expectedOutflows: 0,
      net: 0,
      runningCash: 0,
    });
  }

  // 1) Bucket each customer's open balance by reputation tier.
  for (const c of data.customers as Customer[]) {
    if (c.amountOwed <= 0) continue;
    const tier = tierFor(c.reputationScore);
    const expected = Math.round(c.amountOwed * tier.probability);
    const idx = Math.min(tier.weekOffset, WEEKS_AHEAD - 1);
    weeks[idx].expectedInflows += expected;
  }

  // 2) Spread monthly outflows uniformly. monthly / 4.33 ≈ weekly.
  const weeklyOutflow = Math.round(
    org.cashflowMonthlyOutflowCents / (52 / 12),
  );
  for (const w of weeks) {
    w.expectedOutflows = weeklyOutflow;
  }

  // 3) Spread expected new revenue weekly, but assume a 3-week
  //    bill-to-paid delay so the first 3 weeks see nothing new.
  const weeklyNewRevenue = Math.round(
    org.cashflowMonthlyNewInvoicesCents / (52 / 12),
  );
  for (let i = 3; i < WEEKS_AHEAD; i++) {
    weeks[i].expectedNewRevenue = weeklyNewRevenue;
  }

  // 4) Compute net + running totals.
  let running = 0;
  for (const w of weeks) {
    w.net = w.expectedInflows + w.expectedNewRevenue - w.expectedOutflows;
    running += w.net;
    w.runningCash = running;
  }

  const totals = weeks.reduce(
    (acc, w) => ({
      inflows: acc.inflows + w.expectedInflows,
      outflows: acc.outflows + w.expectedOutflows,
      newRevenue: acc.newRevenue + w.expectedNewRevenue,
      net: acc.net + w.net,
    }),
    { inflows: 0, outflows: 0, newRevenue: 0, net: 0 },
  );

  return {
    connected: true,
    companyName: data.companyName,
    weeks,
    totals,
    assumptions: {
      monthlyOutflowCents: org.cashflowMonthlyOutflowCents,
      monthlyNewInvoicesCents: org.cashflowMonthlyNewInvoicesCents,
      weeksAhead: WEEKS_AHEAD,
      repHaircuts: TIER_RULES.map((r) => ({
        tier: r.label,
        probability: r.probability,
        week: r.weekOffset,
      })),
    },
  };
}
