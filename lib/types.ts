export type RiskTier = "low" | "medium" | "high";

export type FilterKey = "all" | "overdue" | "high-risk" | "low-risk";

export type Customer = {
  id: string;
  name: string;
  amountOwed: number;
  daysLate: number;
  riskTier: RiskTier;
  phone: string;
};

export type Business = {
  name: string;
};
