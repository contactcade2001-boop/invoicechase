import "server-only";
import type { Customer, RiskTier } from "@/lib/types";
import { mockBusiness, mockCustomers } from "@/lib/mockData";
import { useMockData } from "../env";
import { getActiveConnection } from "../db/connections";
import {
  listCustomers,
  listOpenInvoices,
  type QboCustomer,
  type QboInvoice,
} from "./client";

export type DashboardData =
  | { connected: false }
  | { connected: true; companyName: string; customers: Customer[] };

function daysBetween(fromIso: string, today: Date): number {
  const from = new Date(fromIso + "T00:00:00Z");
  const ms = today.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function reputationFromOldestDaysLate(daysLate: number): number {
  if (daysLate > 60) return 420;
  if (daysLate > 30) return 555;
  if (daysLate > 7) return 645;
  if (daysLate > 0) return 715;
  return 770;
}

function tierFromScore(score: number): RiskTier {
  if (score < 580) return "high";
  if (score < 740) return "medium";
  return "low";
}

function pickPhone(c: QboCustomer): string {
  return (
    c.PrimaryPhone?.FreeFormNumber ?? c.Mobile?.FreeFormNumber ?? ""
  );
}

function aggregate(
  customers: QboCustomer[],
  invoices: QboInvoice[],
): Customer[] {
  const byId = new Map<string, QboCustomer>();
  for (const c of customers) byId.set(c.Id, c);

  const today = new Date();
  const grouped = new Map<
    string,
    { totalCents: number; oldestDaysLate: number }
  >();

  for (const inv of invoices) {
    if (!inv.Balance || inv.Balance <= 0) continue;
    const customerId = inv.CustomerRef.value;
    const dueOrTxn = inv.DueDate ?? inv.TxnDate;
    const daysLate = daysBetween(dueOrTxn, today);
    const cents = Math.round(inv.Balance * 100);
    const cur = grouped.get(customerId);
    if (cur) {
      cur.totalCents += cents;
      if (daysLate > cur.oldestDaysLate) cur.oldestDaysLate = daysLate;
    } else {
      grouped.set(customerId, {
        totalCents: cents,
        oldestDaysLate: daysLate,
      });
    }
  }

  const out: Customer[] = [];
  for (const [id, agg] of grouped) {
    const qbo = byId.get(id);
    if (!qbo) continue;
    const reputationScore = reputationFromOldestDaysLate(agg.oldestDaysLate);
    out.push({
      id,
      name: qbo.DisplayName,
      amountOwed: agg.totalCents,
      daysLate: agg.oldestDaysLate,
      reputationScore,
      riskTier: tierFromScore(reputationScore),
      phone: pickPhone(qbo),
    });
  }
  out.sort((a, b) => b.amountOwed - a.amountOwed);
  return out;
}

export async function getDashboardData(): Promise<DashboardData> {
  if (useMockData()) {
    return {
      connected: true,
      companyName: mockBusiness.name,
      customers: mockCustomers,
    };
  }

  const conn = getActiveConnection();
  if (!conn) return { connected: false };

  const [customers, invoices] = await Promise.all([
    listCustomers(conn),
    listOpenInvoices(conn),
  ]);

  return {
    connected: true,
    companyName: conn.companyName ?? "Your business",
    customers: aggregate(customers, invoices),
  };
}
