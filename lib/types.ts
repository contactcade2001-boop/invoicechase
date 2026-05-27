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
};

export const REPUTATION_MIN = 300;
export const REPUTATION_MAX = 850;

export type Business = {
  name: string;
};
