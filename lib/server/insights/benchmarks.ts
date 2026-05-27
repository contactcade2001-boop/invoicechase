import "server-only";

/**
 * Industry benchmarks for AR health. Numbers are research-backed approximations
 * pulled from CB Insights / NACM / NFIB / industry-specific surveys. Used to
 * give owners a sense of where they stand vs peers.
 */
export type Benchmark = {
  industry: string;
  /** Median DSO in days. */
  dsoMedian: number;
  /** Top decile (best in class) DSO. */
  dsoTopDecile: number;
  /** Median overdue % of total AR. */
  overdueMedian: number;
};

export const BENCHMARKS: Record<string, Benchmark> = {
  Plumbing: { industry: "Plumbing", dsoMedian: 28, dsoTopDecile: 14, overdueMedian: 0.18 },
  HVAC: { industry: "HVAC", dsoMedian: 31, dsoTopDecile: 16, overdueMedian: 0.21 },
  Electrical: { industry: "Electrical", dsoMedian: 34, dsoTopDecile: 18, overdueMedian: 0.22 },
  Roofing: { industry: "Roofing", dsoMedian: 42, dsoTopDecile: 22, overdueMedian: 0.28 },
  Cleaning: { industry: "Cleaning", dsoMedian: 21, dsoTopDecile: 12, overdueMedian: 0.15 },
  Landscaping: { industry: "Landscaping", dsoMedian: 26, dsoTopDecile: 14, overdueMedian: 0.17 },
  "Auto repair": { industry: "Auto repair", dsoMedian: 12, dsoTopDecile: 5, overdueMedian: 0.08 },
  "Pest control": { industry: "Pest control", dsoMedian: 19, dsoTopDecile: 10, overdueMedian: 0.12 },
  "General contracting": {
    industry: "General contracting",
    dsoMedian: 48,
    dsoTopDecile: 26,
    overdueMedian: 0.31,
  },
  Other: { industry: "Service business", dsoMedian: 32, dsoTopDecile: 16, overdueMedian: 0.22 },
};

export function getBenchmark(industry: string | null | undefined): Benchmark {
  if (!industry) return BENCHMARKS.Other;
  return BENCHMARKS[industry] ?? BENCHMARKS.Other;
}

export function dsoVerdict(yourDso: number, bm: Benchmark): {
  label: "best" | "good" | "average" | "behind";
  copy: string;
} {
  if (yourDso <= bm.dsoTopDecile) {
    return {
      label: "best",
      copy: `Top 10% of ${bm.industry.toLowerCase()} businesses. Genuinely elite.`,
    };
  }
  if (yourDso <= bm.dsoMedian) {
    return {
      label: "good",
      copy: `Better than average ${bm.industry.toLowerCase()} — keep going.`,
    };
  }
  if (yourDso <= bm.dsoMedian * 1.4) {
    return {
      label: "average",
      copy: `Roughly average for ${bm.industry.toLowerCase()}. There's room.`,
    };
  }
  return {
    label: "behind",
    copy: `Behind the ${bm.industry.toLowerCase()} median. Time to act.`,
  };
}
