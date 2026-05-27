import "server-only";
import type { Customer } from "@/lib/types";

export type PulseBreakdown = {
  dsoScore: number; // 0-100
  overdueScore: number;
  concentrationScore: number;
  reputationScore: number;
};

export type PulseResult = {
  /** 0–100 composite. Higher = healthier AR. */
  score: number;
  /** Letter grade for quick scan. */
  grade: "A" | "B" | "C" | "D" | "F";
  /** One-line takeaway. */
  headline: string;
  breakdown: PulseBreakdown;
  inputs: {
    dso: number;
    overduePct: number;
    top3Concentration: number; // 0..1 share of total AR in top 3 customers
    avgReputation: number;
    customerCount: number;
  };
};

/**
 * Map an inverted "lower is better" value to a 0-100 score via piecewise
 * linear thresholds.
 */
function thresholdScore(
  value: number,
  good: number,
  bad: number,
): number {
  if (value <= good) return 100;
  if (value >= bad) return 0;
  return Math.round(100 - ((value - good) / (bad - good)) * 100);
}

function gradeFor(score: number): PulseResult["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function computePulse(customers: Customer[]): PulseResult {
  const owing = customers.filter((c) => c.amountOwed > 0);
  const totalOwed = owing.reduce((s, c) => s + c.amountOwed, 0);
  const overdue = owing.filter((c) => c.daysLate > 0);

  // DSO: weighted avg days-late across overdue customers, dollar-weighted.
  let dsoNum = 0;
  let dsoDenom = 0;
  for (const c of overdue) {
    dsoNum += c.daysLate * c.amountOwed;
    dsoDenom += c.amountOwed;
  }
  const dso = dsoDenom > 0 ? Math.round(dsoNum / dsoDenom) : 0;

  const overduePct =
    owing.length === 0 ? 0 : Math.round((overdue.length / owing.length) * 100);

  const sorted = [...owing].sort((a, b) => b.amountOwed - a.amountOwed);
  const top3Total = sorted
    .slice(0, 3)
    .reduce((s, c) => s + c.amountOwed, 0);
  const concentration = totalOwed > 0 ? top3Total / totalOwed : 0;

  const repSum = owing.reduce((s, c) => s + c.reputationScore, 0);
  const avgReputation = owing.length > 0 ? repSum / owing.length : 750;

  // Sub-scores
  const dsoScore = thresholdScore(dso, 7, 60);
  const overdueScore = thresholdScore(overduePct, 10, 50);
  const concentrationScore = thresholdScore(concentration * 100, 25, 75);
  // Reputation is already 300-850; map to 0-100.
  const reputationScore = Math.round(
    ((avgReputation - 300) / (850 - 300)) * 100,
  );

  // Weighted composite. DSO + overdue dominate because they're the most
  // actionable signals for the owner.
  const score = Math.round(
    dsoScore * 0.35 +
      overdueScore * 0.25 +
      reputationScore * 0.25 +
      concentrationScore * 0.15,
  );

  const grade = gradeFor(score);
  const headline =
    score >= 90
      ? "Cashflow is healthy — keep doing what you're doing."
      : score >= 75
        ? "Solid AR health. A few overdue customers to nudge."
        : score >= 60
          ? "Some risk building up. Time to chase the overdue tail."
          : score >= 45
            ? "AR is dragging. Focus on the largest overdue balances first."
            : "Critical. Significant cash is stuck in long-overdue invoices.";

  return {
    score: Math.max(0, Math.min(100, score)),
    grade,
    headline,
    breakdown: {
      dsoScore,
      overdueScore,
      concentrationScore,
      reputationScore,
    },
    inputs: {
      dso,
      overduePct,
      top3Concentration: Math.round(concentration * 100) / 100,
      avgReputation: Math.round(avgReputation),
      customerCount: owing.length,
    },
  };
}
