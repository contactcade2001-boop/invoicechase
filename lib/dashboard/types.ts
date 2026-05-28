/**
 * Shape of everything the owner dashboard renders. ONE typed object so
 * the page is a thin server component that just hands props to children
 * — no infrastructure calls inside the UI tree.
 */

export type Period = "week" | "month" | "quarter";

export type Delta = {
  /** Signed percent change vs the prior equivalent window. */
  pct: number | null;
  direction: "up" | "down" | "flat";
};

export type CollectedSummary = {
  totalCents: number;
  paidInvoiceCount: number;
  delta: Delta;
  /** Pre-formatted "this week" / "this month" label for the toggle. */
  periodLabel: string;
};

export type DsoSummary = {
  currentDays: number;
  baselineDays: number | null;
  /** baseline − current, when both exist. Positive = improved. */
  improvementDays: number | null;
};

export type OverdueInvoice = {
  /** Customer ID — keys the row, used when triggering a reminder. */
  customerId: string;
  customerName: string;
  amountCents: number;
  daysLate: number;
  /** Phone present? When false the row disables Remind. */
  hasPhone: boolean;
};

export type TrendPoint = {
  /** ISO date "YYYY-MM-DD". */
  dateIso: string;
  totalCents: number;
};

export type ActivityKind =
  | "payment"
  | "reminder_sent"
  | "ai_reply"
  | "customer_added";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  /** Short headline e.g. "Paid $4,200" or "AI replied to Bob's HVAC". */
  headline: string;
  /** Subtitle e.g. customer name or "8 reminders sent". */
  subtitle?: string;
  /** UNIX ms. */
  occurredAt: number;
};

export type DashboardData = {
  /** True when the numbers came from real services; false when from
   *  lib/dashboard/mock.ts. Components can surface a "Sample data" hint. */
  isMock: boolean;
  period: Period;
  collected: CollectedSummary;
  dso: DsoSummary;
  overdue: OverdueInvoice[];
  trend: TrendPoint[];
  activity: ActivityItem[];
};
