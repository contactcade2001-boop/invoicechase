import "server-only";
import type { Customer, RiskTier } from "@/lib/types";
import { mockBusiness, mockCustomers } from "@/lib/mockData";
import { useMockData } from "../env";
import { getConnectionForOrg } from "../db/connections";
import {
  invalidateQboDashboardCache,
  readQboDashboardCache,
  writeQboDashboardCache,
} from "../db/qboCache";
import { captureException } from "../observability";
import {
  listCustomers,
  listOpenInvoices,
  listOpenInvoicesForCustomer,
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
  | {
      connected: true;
      companyName: string;
      customers: Customer[];
      refreshedAt?: number;
      stale?: boolean;
    };

const DASHBOARD_TTL_MS = 60_000;

export type CustomerLookup =
  | { ok: true; customer: Customer; companyName: string }
  | { ok: false; reason: "not_connected" | "customer_not_found" };

export type OpenInvoiceLine = {
  id: string;
  number: string | null;
  txnDate: string;
  dueDate: string | null;
  totalCents: number;
  balanceCents: number;
  daysLate: number;
};

export type CustomerDetail =
  | {
      ok: true;
      customer: Customer;
      companyName: string;
      invoices: OpenInvoiceLine[];
    }
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
      email: qbo.PrimaryEmailAddr?.Address,
    });
  }
  out.sort((a, b) => b.amountOwed - a.amountOwed);
  return out;
}

type ConnectedDashboardData = Extract<DashboardData, { connected: true }>;

async function fetchFreshDashboardData(
  organizationId: number,
): Promise<DashboardData> {
  const conn = getConnectionForOrg(organizationId);
  if (conn) {
    const since = isoDaysAgo(new Date(), HISTORY_WINDOW_DAYS);
    const [customers, openInvoices, paidInvoices, payments] = await Promise.all(
      [
        listCustomers(conn),
        listOpenInvoices(conn),
        listPaidInvoicesSince(conn, since),
        listPaymentsSince(conn, since),
      ],
    );
    const signalsByCustomer = collectPaymentSignals(paidInvoices, payments);
    return {
      connected: true,
      companyName: conn.companyName ?? "Your business",
      customers: aggregate(customers, openInvoices, signalsByCustomer),
    };
  }

  // No QBO connection — try Xero, then Jobber. Lazy-imported so the QBO
  // sync module doesn't carry the alternative clients into every bundle.
  const { fetchXeroDashboardData } = await import("../xero/sync");
  const xero = await fetchXeroDashboardData(organizationId);
  if (xero.connected) return xero;

  const { fetchJobberDashboardData } = await import("../jobber/sync");
  const jobber = await fetchJobberDashboardData(organizationId);
  if (jobber.connected) return jobber;

  return { connected: false };
}

function persistDashboardCache(
  organizationId: number,
  data: ConnectedDashboardData,
  refreshedAt: number,
): void {
  try {
    writeQboDashboardCache(
      organizationId,
      JSON.stringify({
        companyName: data.companyName,
        customers: data.customers,
      }),
      refreshedAt,
    );
  } catch (err) {
    captureException(err, {
      where: "qbo.cache.write",
      organizationId,
    });
  }
}

function readCachedDashboard(
  organizationId: number,
): { data: ConnectedDashboardData; refreshedAt: number } | null {
  const cached = readQboDashboardCache(organizationId);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached.payload) as {
      companyName: string;
      customers: Customer[];
    };
    return {
      data: {
        connected: true,
        companyName: parsed.companyName,
        customers: parsed.customers,
        refreshedAt: cached.refreshedAt,
      },
      refreshedAt: cached.refreshedAt,
    };
  } catch {
    invalidateQboDashboardCache(organizationId);
    return null;
  }
}

export async function getDashboardData(
  organizationId: number,
  options?: { forceRefresh?: boolean },
): Promise<DashboardData> {
  if (useMockData()) {
    return {
      connected: true,
      companyName: mockBusiness.name,
      customers: mockCustomers,
      refreshedAt: Date.now(),
    };
  }

  const force = options?.forceRefresh === true;
  const now = Date.now();

  if (!force) {
    const cached = readCachedDashboard(organizationId);
    if (cached && now - cached.refreshedAt < DASHBOARD_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const fresh = await fetchFreshDashboardData(organizationId);
    if (fresh.connected) {
      persistDashboardCache(organizationId, fresh, now);
      return { ...fresh, refreshedAt: now };
    }
    // Disconnected: drop any stale cache so it doesn't bleed across re-connects.
    invalidateQboDashboardCache(organizationId);
    return fresh;
  } catch (err) {
    // QBO blip: fall back to cached data (stale) so the dashboard still loads.
    const cached = readCachedDashboard(organizationId);
    if (cached) {
      captureException(err, {
        where: "qbo.dashboard.fetch_failed_using_stale",
        organizationId,
        cachedAgeMs: now - cached.refreshedAt,
      });
      return { ...cached.data, stale: true };
    }
    throw err;
  }
}

export function invalidateDashboardCache(organizationId: number): void {
  invalidateQboDashboardCache(organizationId);
}

export async function warmDashboardCache(organizationId: number): Promise<void> {
  try {
    await getDashboardData(organizationId, { forceRefresh: true });
  } catch (err) {
    captureException(err, {
      where: "qbo.dashboard.warm",
      organizationId,
    });
  }
}

export async function lookupCustomerForOrg(
  organizationId: number,
  customerId: string,
): Promise<CustomerLookup> {
  const data = await getDashboardData(organizationId);
  if (!data.connected) return { ok: false, reason: "not_connected" };
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return { ok: false, reason: "customer_not_found" };
  return { ok: true, customer, companyName: data.companyName };
}

function mockInvoicesFor(customer: Customer): OpenInvoiceLine[] {
  if (customer.amountOwed <= 0) return [];
  const today = new Date();
  const dueDate = new Date(
    today.getTime() - customer.daysLate * MS_PER_DAY,
  );
  const txnDate = new Date(dueDate.getTime() - 30 * MS_PER_DAY);
  return [
    {
      id: `mock-inv-${customer.id}`,
      number: `INV-${customer.id.slice(-3).toUpperCase()}`,
      txnDate: txnDate.toISOString().slice(0, 10),
      dueDate: dueDate.toISOString().slice(0, 10),
      totalCents: customer.amountOwed,
      balanceCents: customer.amountOwed,
      daysLate: customer.daysLate,
    },
  ];
}

function toLine(inv: QboInvoice, today: Date): OpenInvoiceLine {
  const dueOrTxn = inv.DueDate ?? inv.TxnDate;
  return {
    id: inv.Id,
    number: inv.DocNumber ?? null,
    txnDate: inv.TxnDate,
    dueDate: inv.DueDate ?? null,
    totalCents: Math.round(inv.TotalAmt * 100),
    balanceCents: Math.round(inv.Balance * 100),
    daysLate: daysBetween(dueOrTxn, today),
  };
}

export async function getCustomerDetail(
  organizationId: number,
  customerId: string,
): Promise<CustomerDetail> {
  const lookup = await lookupCustomerForOrg(organizationId, customerId);
  if (!lookup.ok) return lookup;

  if (useMockData()) {
    return {
      ok: true,
      customer: lookup.customer,
      companyName: lookup.companyName,
      invoices: mockInvoicesFor(lookup.customer),
    };
  }

  const conn = getConnectionForOrg(organizationId);
  if (conn) {
    const today = new Date();
    const invoices = (await listOpenInvoicesForCustomer(conn, customerId))
      .map((inv) => toLine(inv, today))
      .sort((a, b) => b.daysLate - a.daysLate);
    return {
      ok: true,
      customer: lookup.customer,
      companyName: lookup.companyName,
      invoices,
    };
  }

  // Xero customer detail
  const { fetchXeroCustomerInvoices } = await import("../xero/sync");
  const xeroInvoices = await fetchXeroCustomerInvoices(
    organizationId,
    customerId,
  );
  if (xeroInvoices.length > 0) {
    return {
      ok: true,
      customer: lookup.customer,
      companyName: lookup.companyName,
      invoices: xeroInvoices,
    };
  }

  // Jobber customer detail
  const { fetchJobberCustomerInvoices } = await import("../jobber/sync");
  const jobberInvoices = await fetchJobberCustomerInvoices(
    organizationId,
    customerId,
  );
  return {
    ok: true,
    customer: lookup.customer,
    companyName: lookup.companyName,
    invoices: jobberInvoices,
  };
}
