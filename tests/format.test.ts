import { describe, expect, it } from "vitest";
import {
  applyFilter,
  computeDSO,
  computeTotalOwed,
  describeDays,
  formatCurrency,
} from "@/lib/format";
import type { Customer } from "@/lib/types";

const sample: Customer[] = [
  {
    id: "1",
    name: "A",
    amountOwed: 100000,
    daysLate: 30,
    riskTier: "high",
    reputationScore: 500,
    phone: "+1",
  },
  {
    id: "2",
    name: "B",
    amountOwed: 50000,
    daysLate: 10,
    riskTier: "medium",
    reputationScore: 650,
    phone: "+1",
  },
  {
    id: "3",
    name: "C",
    amountOwed: 25000,
    daysLate: -5,
    riskTier: "low",
    reputationScore: 780,
    phone: "+1",
  },
];

describe("format helpers", () => {
  it("formats USD with no fractional cents on whole dollars", () => {
    expect(formatCurrency(420000)).toBe("$4,200");
    expect(formatCurrency(99)).toBe("$1");
  });

  it("describes days late, due today, and not yet due", () => {
    expect(describeDays(1)).toBe("1 day late");
    expect(describeDays(7)).toBe("7 days late");
    expect(describeDays(0)).toBe("Due today");
    expect(describeDays(-3)).toBe("Due in 3 days");
  });

  it("totals every customer", () => {
    expect(computeTotalOwed(sample)).toBe(175000);
  });

  it("computes weighted DSO over overdue customers only", () => {
    // overdue total = 150000 (A:100k + B:50k); weighted = 100k*30 + 50k*10 = 3.5M
    // 3,500,000 / 150,000 = 23.33 → rounds to 23
    expect(computeDSO(sample)).toBe(23);
  });

  it("returns 0 DSO when no one is overdue", () => {
    const allEarly: Customer[] = [
      { ...sample[2], amountOwed: 25000, daysLate: -10 },
    ];
    expect(computeDSO(allEarly)).toBe(0);
  });

  it("filters by overdue / risk tier", () => {
    expect(applyFilter(sample, "all").length).toBe(3);
    expect(applyFilter(sample, "overdue").map((c) => c.id)).toEqual([
      "1",
      "2",
    ]);
    expect(applyFilter(sample, "high-risk").map((c) => c.id)).toEqual(["1"]);
    expect(applyFilter(sample, "low-risk").map((c) => c.id)).toEqual(["3"]);
  });
});
