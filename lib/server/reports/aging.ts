import "server-only";
import type { Customer } from "@/lib/types";
import { getDashboardData } from "../qbo/sync";
import { csvLine } from "./csv";

export type AgingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export type AgingRow = {
  customer: Customer;
  bucket: AgingBucket;
};

export function bucketize(daysLate: number): AgingBucket {
  if (daysLate <= 0) return "current";
  if (daysLate <= 30) return "1-30";
  if (daysLate <= 60) return "31-60";
  if (daysLate <= 90) return "61-90";
  return "90+";
}

export type AgingTotals = Record<AgingBucket, number>;

export async function buildAgingCsv(orgId: number): Promise<string | null> {
  const data = await getDashboardData(orgId);
  if (!data.connected) return null;
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];
  lines.push(
    csvLine([
      "Report",
      `AR Aging — ${data.companyName}`,
      "Generated",
      today,
    ]),
  );
  lines.push("");
  lines.push(
    csvLine([
      "Customer",
      "Phone",
      "Email",
      "Days late (oldest)",
      "Bucket",
      "Amount owed",
      "Reputation",
    ]),
  );
  const totals: AgingTotals = {
    current: 0,
    "1-30": 0,
    "31-60": 0,
    "61-90": 0,
    "90+": 0,
  };
  for (const c of data.customers) {
    if (c.amountOwed <= 0) continue;
    const bucket = bucketize(c.daysLate);
    totals[bucket] += c.amountOwed;
    lines.push(
      csvLine([
        c.name,
        c.phone ?? "",
        c.email ?? "",
        c.daysLate,
        bucket,
        (c.amountOwed / 100).toFixed(2),
        c.reputationScore,
      ]),
    );
  }
  lines.push("");
  lines.push(csvLine(["Bucket totals"]));
  for (const bucket of [
    "current",
    "1-30",
    "31-60",
    "61-90",
    "90+",
  ] as const) {
    lines.push(csvLine([bucket, (totals[bucket] / 100).toFixed(2)]));
  }
  return lines.join("\r\n") + "\r\n";
}
