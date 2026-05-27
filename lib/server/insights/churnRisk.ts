import "server-only";
import type { Customer } from "@/lib/types";

export type ChurnRiskBand = "low" | "medium" | "high" | "critical";

export type ChurnRiskedCustomer = {
  id: string;
  name: string;
  /** 0–100. Higher = more likely to leave for a competitor. */
  riskScore: number;
  band: ChurnRiskBand;
  /** Trailing-12mo revenue (cents). Inferred when not stored. */
  annualRevenueCents: number;
  /** Estimated cost to replace this customer (cents). 25% of annual revenue,
   * floored at $500. Reflects typical SMB CAC for repeat-service clients. */
  replacementCostCents: number;
  /** Total dollars you'd forfeit if they churned next month (annual revenue +
   * replacement cost + currently open balance). */
  revenueAtRiskCents: number;
  /** Per-customer signal in plain English. */
  reason: string;
};

export type ChurnRiskResult = {
  topAtRisk: ChurnRiskedCustomer[];
  totalAtRiskCents: number;
  /** Top revenue customers regardless of risk (for the "VIPs" view). */
  topByRevenue: ChurnRiskedCustomer[];
};

const REPLACEMENT_FLOOR_CENTS = 50000; // $500
const REPLACEMENT_RATE = 0.25;

function inferAnnualRevenueCents(c: Customer): number {
  if (typeof c.annualRevenueCents === "number" && c.annualRevenueCents > 0) {
    return c.annualRevenueCents;
  }
  // Reasonable fallback: assume the open balance is one of ~4 invoices/year.
  // Floor at $2k so very small overdue balances don't underestimate value.
  return Math.max(c.amountOwed * 4, 200_000);
}

function bandFor(score: number): ChurnRiskBand {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function buildReason(c: Customer, rep: number, days: number): string {
  const bits: string[] = [];
  if (rep < 580) bits.push(`reputation ${rep} (poor)`);
  else if (rep < 670) bits.push(`reputation ${rep} (fair)`);
  if (days > 60) bits.push(`${days}d overdue`);
  else if (days > 30) bits.push(`${days}d overdue`);
  if (c.amountOwed >= 200_000) bits.push(`large open balance`);
  if (bits.length === 0) return "Stable so far — keep nurturing.";
  return bits.join(" · ");
}

/**
 * Risk components (each 0–100, weighted):
 *   reputation gap   weight 0.45
 *   days-late penalty weight 0.30
 *   balance pressure  weight 0.15  (current open / annual revenue)
 *   silence penalty   weight 0.10  (no payment in long while → days-late proxy)
 *
 * No history table required — works against the same Customer shape the
 * dashboard already renders.
 */
function scoreCustomer(c: Customer, annualRevenueCents: number): number {
  const repGap = Math.min(100, ((850 - c.reputationScore) / 550) * 100);
  const daysPenalty =
    c.daysLate <= 0
      ? 0
      : Math.min(100, (c.daysLate / 90) * 100);
  const balancePressure = annualRevenueCents > 0
    ? Math.min(100, (c.amountOwed / annualRevenueCents) * 100)
    : 0;
  const silence = c.daysLate > 30 ? Math.min(100, (c.daysLate - 30) * 2) : 0;

  const composite =
    repGap * 0.45 +
    daysPenalty * 0.3 +
    balancePressure * 0.15 +
    silence * 0.1;

  return Math.round(Math.max(0, Math.min(100, composite)));
}

export function computeChurnRisk(
  customers: Customer[],
  options?: { topN?: number },
): ChurnRiskResult {
  const topN = options?.topN ?? 5;

  const enriched: ChurnRiskedCustomer[] = customers.map((c) => {
    const annualRevenueCents = inferAnnualRevenueCents(c);
    const riskScore = scoreCustomer(c, annualRevenueCents);
    const replacementCostCents = Math.max(
      REPLACEMENT_FLOOR_CENTS,
      Math.round(annualRevenueCents * REPLACEMENT_RATE),
    );
    const revenueAtRiskCents =
      annualRevenueCents + replacementCostCents + c.amountOwed;
    return {
      id: c.id,
      name: c.name,
      riskScore,
      band: bandFor(riskScore),
      annualRevenueCents,
      replacementCostCents,
      revenueAtRiskCents,
      reason: buildReason(c, c.reputationScore, c.daysLate),
    };
  });

  // Rank by revenue-at-risk × risk-score so we surface high-value AND high-risk
  // together — a small at-risk customer ranks below a big stable one only when
  // the stable one is genuinely at risk.
  const topAtRisk = [...enriched]
    .filter((e) => e.riskScore >= 30)
    .sort(
      (a, b) =>
        b.riskScore * b.revenueAtRiskCents - a.riskScore * a.revenueAtRiskCents,
    )
    .slice(0, topN);

  const topByRevenue = [...enriched]
    .sort((a, b) => b.annualRevenueCents - a.annualRevenueCents)
    .slice(0, topN);

  const totalAtRiskCents = topAtRisk.reduce(
    (s, c) => s + c.revenueAtRiskCents,
    0,
  );

  return { topAtRisk, totalAtRiskCents, topByRevenue };
}
