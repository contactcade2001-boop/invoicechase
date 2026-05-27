export type RiskTier = "low" | "medium" | "high";

export type FilterKey = "all" | "overdue" | "high-risk" | "low-risk";

export type Customer = {
  id: string;
  name: string;
  amountOwed: number;
  daysLate: number;
  riskTier: RiskTier;
  reputationScore: number;
  phone: string;
  email?: string;
  address?: string;
  /** Trailing-12mo revenue from this customer (cents). Optional — when
   * missing, churn-risk inference falls back to amountOwed × 4. */
  annualRevenueCents?: number;
};

export const REPUTATION_MIN = 300;
export const REPUTATION_MAX = 850;

export type Business = {
  name: string;
};
