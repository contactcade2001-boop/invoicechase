import type { Customer, FilterKey } from "./types";

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatCurrencyDetailed(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function describeDays(daysLate: number): string {
  if (daysLate > 0) return `${daysLate} day${daysLate === 1 ? "" : "s"} late`;
  if (daysLate === 0) return "Due today";
  const ahead = -daysLate;
  return `Due in ${ahead} day${ahead === 1 ? "" : "s"}`;
}

export function computeTotalOwed(customers: Customer[]): number {
  return customers.reduce((sum, c) => sum + c.amountOwed, 0);
}

export function computeDSO(customers: Customer[]): number {
  const overdue = customers.filter((c) => c.daysLate > 0);
  if (overdue.length === 0) return 0;
  const totalAmount = overdue.reduce((sum, c) => sum + c.amountOwed, 0);
  if (totalAmount === 0) return 0;
  const weighted = overdue.reduce(
    (sum, c) => sum + c.amountOwed * c.daysLate,
    0,
  );
  return Math.round(weighted / totalAmount);
}

export function applyFilter(
  customers: Customer[],
  filter: FilterKey,
): Customer[] {
  switch (filter) {
    case "all":
      return customers.filter((c) => c.amountOwed > 0);
    case "overdue":
      return customers.filter((c) => c.daysLate > 0);
    case "high-risk":
      return customers.filter((c) => c.riskTier === "high");
    case "low-risk":
      return customers.filter((c) => c.riskTier === "low");
  }
}
