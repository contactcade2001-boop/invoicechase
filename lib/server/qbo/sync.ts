import "server-only";
import type { Customer, RiskTier } from "@/lib/types";
import { mockBusiness, mockCustomers } from "@/lib/mockData";
import { useMockData } from "../env";
import { getConnectionForUser } from "../db/connections";
import {
  listCustomers,
  listOpenInvoices,
  listPaidInvoicesSince,
  listPaymentsSince,
  type QboCustomer,
  type QboInvoice,
} from "./client";
import {
  collectPaymentSignals,
  reputationFor,
  type PaymentSignal,
} from "./reputation";

export type DashboardData =
  | { connected: false }
  | { connected: true; companyName: string; customers: Customer[] };

export type CustomerLookup =
  | { ok: true; customer: Customer; companyName: string }
  | { ok: false; reason: "not_connected" | "customer_not_found" };

const HISTORY_WINDOW_DAYS = 730;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(fromIso: string, today: Date): number {
  const from = new Date(fromIso + "T00:00:00Z");
  const ms = today.getTime() - from.getTime();
  return Math.floor(ms / MS_PER_DAY);
}

function isoDaysAgo(today: Date, days: number): string {
  const past = new Date(today.getTime() - days * MS_PER_DAY);
  return past.toISOString().slice(0, 10);
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
  openInvoices: QboInvoice[],
  signalsByCustomer: Map<string, PaymentSignal[]>,
): Customer[] {
  const byId = new Map<string, QboCustomer>();
  for (const c of customers) byId.set(c.Id, c);

  const today = new Date();
  const grouped = new Map<
    string,
    { totalCents: number; oldestDaysLate: number }
  >();

  for (const inv of openInvoices) {
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
    const reputationScore = reputationFor(
      signalsByCustomer.get(id),
      agg.oldestDaysLate,
    );
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

export async function getDashboardData(
  userId: number,
): Promise<DashboardData> {
  if (useMockData()) {
    return {
      connected: true,
      companyName: mockBusiness.name,
      customers: mockCustomers,
    };
  }

  const conn = getConnectionForUser(userId);
  if (!conn) return { connected: false };

  const since = isoDaysAgo(new Date(), HISTORY_WINDOW_DAYS);
  const [customers, openInvoices, paidInvoices, payments] = await Promise.all([
    listCustomers(conn),
    listOpenInvoices(conn),
    listPaidInvoicesSince(conn, since),
    listPaymentsSince(conn, since),
  ]);

  const signalsByCustomer = collectPaymentSignals(paidInvoices, payments);

  return {
    connected: true,
    companyName: conn.companyName ?? "Your business",
    customers: aggregate(customers, openInvoices, signalsByCustomer),
  };
}

export async function lookupCustomerForUser(
  userId: number,
  customerId: string,
): Promise<CustomerLookup> {
  const data = await getDashboardData(userId);
  if (!data.connected) return { ok: false, reason: "not_connected" };
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return { ok: false, reason: "customer_not_found" };
  return { ok: true, customer, companyName: data.companyName };
}
