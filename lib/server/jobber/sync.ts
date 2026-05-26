import "server-only";
import type { Customer, RiskTier } from "@/lib/types";
import { getJobberConnectionForOrg } from "../db/jobberConnections";
import { reputationFor, type PaymentSignal } from "../qbo/reputation";
import {
  listClients,
  listOpenInvoices,
  listOpenInvoicesForClient,
  listPaidInvoicesSince,
  type JobberClient,
  type JobberInvoice,
} from "./client";
import type { OpenInvoiceLine } from "../qbo/sync";

const HISTORY_WINDOW_DAYS = 730;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(fromIso: string, today: Date): number {
  const from = new Date(fromIso + "T00:00:00Z");
  return Math.floor((today.getTime() - from.getTime()) / MS_PER_DAY);
}

function isoDaysAgo(today: Date, days: number): string {
  return new Date(today.getTime() - days * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);
}

function tierFromScore(score: number): RiskTier {
  if (score < 580) return "high";
  if (score < 740) return "medium";
  return "low";
}

function displayName(c: JobberClient): string {
  if (c.companyName) return c.companyName;
  if (c.name) return c.name;
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Customer";
}

function pickEmail(c: JobberClient): string | undefined {
  return c.emails?.find((e) => e.address)?.address;
}

function pickPhone(c: JobberClient): string {
  return c.phones?.find((p) => p.number)?.number ?? "";
}

function collectSignals(
  paidInvoices: JobberInvoice[],
): Map<string, PaymentSignal[]> {
  const byCustomer = new Map<string, PaymentSignal[]>();
  for (const inv of paidInvoices) {
    if (!inv.dueDate || !inv.issuedDate) continue;
    // Jobber doesn't expose a "paid on" date in the same way QBO/Xero do.
    // The best proxy we have is the most recent payment date — but since
    // the payment-history shape isn't on the Invoice node, we fall back
    // to issuedDate as the lower-bound, which yields a slightly noisier
    // signal but stays directionally correct (paid invoices closer to
    // due date → better reputation).
    const due = new Date(inv.dueDate + "T00:00:00Z").getTime();
    const issued = new Date(inv.issuedDate + "T00:00:00Z").getTime();
    if (Number.isNaN(due) || Number.isNaN(issued)) continue;
    const proxyDaysLate = Math.max(0, Math.floor((issued - due) / MS_PER_DAY));
    const list = byCustomer.get(inv.client.id) ?? [];
    list.push({ customerId: inv.client.id, daysLate: proxyDaysLate });
    byCustomer.set(inv.client.id, list);
  }
  return byCustomer;
}

function aggregate(
  clients: JobberClient[],
  openInvoices: JobberInvoice[],
  signalsByCustomer: Map<string, PaymentSignal[]>,
): Customer[] {
  const byId = new Map<string, JobberClient>();
  for (const c of clients) byId.set(c.id, c);

  const today = new Date();
  const grouped = new Map<
    string,
    { totalCents: number; oldestDaysLate: number }
  >();

  for (const inv of openInvoices) {
    const balance = inv.amounts?.balance ?? 0;
    if (balance <= 0) continue;
    const clientId = inv.client.id;
    const dueOrIssued = inv.dueDate ?? inv.issuedDate;
    const daysLate = dueOrIssued ? daysBetween(dueOrIssued, today) : 0;
    const cents = Math.round(balance * 100);
    const cur = grouped.get(clientId);
    if (cur) {
      cur.totalCents += cents;
      if (daysLate > cur.oldestDaysLate) cur.oldestDaysLate = daysLate;
    } else {
      grouped.set(clientId, { totalCents: cents, oldestDaysLate: daysLate });
    }
  }

  const out: Customer[] = [];
  for (const [id, agg] of grouped) {
    const c = byId.get(id);
    if (!c) continue;
    const reputationScore = reputationFor(
      signalsByCustomer.get(id),
      agg.oldestDaysLate,
    );
    out.push({
      id,
      name: displayName(c),
      amountOwed: agg.totalCents,
      daysLate: agg.oldestDaysLate,
      reputationScore,
      riskTier: tierFromScore(reputationScore),
      phone: pickPhone(c),
      email: pickEmail(c),
    });
  }
  out.sort((a, b) => b.amountOwed - a.amountOwed);
  return out;
}

export async function fetchJobberDashboardData(
  organizationId: number,
): Promise<
  | { connected: false }
  | { connected: true; companyName: string; customers: Customer[] }
> {
  const conn = getJobberConnectionForOrg(organizationId);
  if (!conn) return { connected: false };
  const since = isoDaysAgo(new Date(), HISTORY_WINDOW_DAYS);
  const [clients, openInvoices, paidInvoices] = await Promise.all([
    listClients(conn),
    listOpenInvoices(conn),
    listPaidInvoicesSince(conn, since),
  ]);
  const signalsByCustomer = collectSignals(paidInvoices);
  return {
    connected: true,
    companyName: conn.accountName ?? "Your business",
    customers: aggregate(clients, openInvoices, signalsByCustomer),
  };
}

function toLine(inv: JobberInvoice, today: Date): OpenInvoiceLine {
  const due = inv.dueDate ?? inv.issuedDate ?? null;
  return {
    id: inv.id,
    number: inv.invoiceNumber ?? null,
    txnDate: inv.issuedDate ?? "",
    dueDate: inv.dueDate ?? null,
    totalCents: Math.round((inv.amounts?.total ?? 0) * 100),
    balanceCents: Math.round((inv.amounts?.balance ?? 0) * 100),
    daysLate: due ? daysBetween(due, today) : 0,
  };
}

export async function fetchJobberCustomerInvoices(
  organizationId: number,
  customerId: string,
): Promise<OpenInvoiceLine[]> {
  const conn = getJobberConnectionForOrg(organizationId);
  if (!conn) return [];
  const invoices = await listOpenInvoicesForClient(conn, customerId);
  const today = new Date();
  return invoices
    .map((inv) => toLine(inv, today))
    .sort((a, b) => b.daysLate - a.daysLate);
}
