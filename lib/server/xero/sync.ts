import "server-only";
import type { Customer, RiskTier } from "@/lib/types";
import { getXeroConnectionForOrg } from "../db/xeroConnections";
import { reputationFor, type PaymentSignal } from "../qbo/reputation";
import {
  listCustomers,
  listOpenInvoices,
  listOpenInvoicesForCustomer,
  listPaidInvoicesSince,
  parseXeroDate,
  type XeroContact,
  type XeroInvoice,
} from "./client";
import type { OpenInvoiceLine } from "../qbo/sync";

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

function pickPhone(c: XeroContact): string {
  if (!c.Phones || c.Phones.length === 0) return "";
  const mobile = c.Phones.find((p) => p.PhoneType === "MOBILE" && p.PhoneNumber);
  const def = c.Phones.find((p) => p.PhoneType === "DEFAULT" && p.PhoneNumber);
  const any = c.Phones.find((p) => p.PhoneNumber);
  const chosen = mobile ?? def ?? any;
  if (!chosen?.PhoneNumber) return "";
  // Reassemble country + area + number when present.
  const parts = [
    chosen.PhoneCountryCode ?? "",
    chosen.PhoneAreaCode ?? "",
    chosen.PhoneNumber ?? "",
  ];
  return parts.filter(Boolean).join(" ").trim();
}

function collectXeroPaymentSignals(
  paidInvoices: XeroInvoice[],
): Map<string, PaymentSignal[]> {
  const byCustomer = new Map<string, PaymentSignal[]>();
  for (const inv of paidInvoices) {
    const dueIso = parseXeroDate(inv.DueDate);
    const paidIso = parseXeroDate(inv.FullyPaidOnDate);
    if (!dueIso || !paidIso) continue;
    const due = new Date(dueIso + "T00:00:00Z").getTime();
    const paid = new Date(paidIso + "T00:00:00Z").getTime();
    const daysLate = Math.floor((paid - due) / MS_PER_DAY);
    const customerId = inv.Contact.ContactID;
    const list = byCustomer.get(customerId) ?? [];
    list.push({ customerId, daysLate });
    byCustomer.set(customerId, list);
  }
  return byCustomer;
}

function aggregate(
  customers: XeroContact[],
  openInvoices: XeroInvoice[],
  signalsByCustomer: Map<string, PaymentSignal[]>,
): Customer[] {
  const byId = new Map<string, XeroContact>();
  for (const c of customers) byId.set(c.ContactID, c);

  const today = new Date();
  const grouped = new Map<
    string,
    { totalCents: number; oldestDaysLate: number }
  >();

  for (const inv of openInvoices) {
    if (!inv.AmountDue || inv.AmountDue <= 0) continue;
    const customerId = inv.Contact.ContactID;
    const dueOrTxn =
      parseXeroDate(inv.DueDate) ?? parseXeroDate(inv.Date) ?? null;
    const daysLate = dueOrTxn ? daysBetween(dueOrTxn, today) : 0;
    const cents = Math.round(inv.AmountDue * 100);
    const cur = grouped.get(customerId);
    if (cur) {
      cur.totalCents += cents;
      if (daysLate > cur.oldestDaysLate) cur.oldestDaysLate = daysLate;
    } else {
      grouped.set(customerId, { totalCents: cents, oldestDaysLate: daysLate });
    }
  }

  const out: Customer[] = [];
  for (const [id, agg] of grouped) {
    const xero = byId.get(id);
    if (!xero) continue;
    const reputationScore = reputationFor(
      signalsByCustomer.get(id),
      agg.oldestDaysLate,
    );
    out.push({
      id,
      name: xero.Name,
      amountOwed: agg.totalCents,
      daysLate: agg.oldestDaysLate,
      reputationScore,
      riskTier: tierFromScore(reputationScore),
      phone: pickPhone(xero),
      email: xero.EmailAddress,
    });
  }
  out.sort((a, b) => b.amountOwed - a.amountOwed);
  return out;
}

export async function fetchXeroDashboardData(
  organizationId: number,
): Promise<
  | { connected: false }
  | { connected: true; companyName: string; customers: Customer[] }
> {
  const conn = getXeroConnectionForOrg(organizationId);
  if (!conn) return { connected: false };

  const since = isoDaysAgo(new Date(), HISTORY_WINDOW_DAYS);
  const [customers, openInvoices, paidInvoices] = await Promise.all([
    listCustomers(conn),
    listOpenInvoices(conn),
    listPaidInvoicesSince(conn, since),
  ]);

  const signalsByCustomer = collectXeroPaymentSignals(paidInvoices);

  return {
    connected: true,
    companyName: conn.tenantName ?? "Your business",
    customers: aggregate(customers, openInvoices, signalsByCustomer),
  };
}

function toLine(inv: XeroInvoice, today: Date): OpenInvoiceLine {
  const dueOrTxn =
    parseXeroDate(inv.DueDate) ?? parseXeroDate(inv.Date) ?? null;
  return {
    id: inv.InvoiceID,
    number: inv.InvoiceNumber ?? null,
    txnDate: parseXeroDate(inv.Date) ?? "",
    dueDate: parseXeroDate(inv.DueDate),
    totalCents: Math.round(inv.Total * 100),
    balanceCents: Math.round(inv.AmountDue * 100),
    daysLate: dueOrTxn ? daysBetween(dueOrTxn, today) : 0,
  };
}

export async function fetchXeroCustomerInvoices(
  organizationId: number,
  customerId: string,
): Promise<OpenInvoiceLine[]> {
  const conn = getXeroConnectionForOrg(organizationId);
  if (!conn) return [];
  const invoices = await listOpenInvoicesForCustomer(conn, customerId);
  const today = new Date();
  return invoices
    .map((inv) => toLine(inv, today))
    .sort((a, b) => b.daysLate - a.daysLate);
}
