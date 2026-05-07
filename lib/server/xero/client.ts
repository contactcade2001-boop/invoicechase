import "server-only";
import { decryptToken, encryptToken } from "../crypto";
import {
  getXeroConnectionForOrg,
  upsertXeroConnection,
} from "../db/xeroConnections";
import type { XeroConnectionRow } from "../db/schema";
import { refreshTokens } from "./oauth";
import { XERO_API_BASE } from "./config";

// Refresh tokens 5 minutes before they expire so a slow API call doesn't
// straddle the expiry boundary.
const REFRESH_LEEWAY_MS = 5 * 60 * 1000;

async function ensureFreshAccessToken(
  conn: XeroConnectionRow,
): Promise<string> {
  if (conn.accessTokenExpiresAt > Date.now() + REFRESH_LEEWAY_MS) {
    return decryptToken(conn.accessTokenEnc);
  }
  // Xero rotates refresh tokens — store the new one immediately.
  const refresh = decryptToken(conn.refreshTokenEnc);
  const fresh = await refreshTokens(refresh);
  const now = Date.now();
  upsertXeroConnection({
    organizationId: conn.organizationId,
    tenantId: conn.tenantId,
    tenantName: conn.tenantName,
    accessTokenEnc: encryptToken(fresh.access_token),
    refreshTokenEnc: encryptToken(fresh.refresh_token),
    accessTokenExpiresAt: now + fresh.expires_in * 1000,
    // Xero refresh tokens are valid for 60 days from issue.
    refreshTokenExpiresAt: now + 60 * 24 * 60 * 60 * 1000,
  });
  return fresh.access_token;
}

async function xeroFetch<T>(
  conn: XeroConnectionRow,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const accessToken = await ensureFreshAccessToken(conn);
  const headers = new Headers(init?.headers ?? {});
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Xero-Tenant-Id", conn.tenantId);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${XERO_API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Xero ${path} ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export type XeroPhone = {
  PhoneType?: "DEFAULT" | "MOBILE" | "FAX" | "DDI" | string;
  PhoneNumber?: string;
  PhoneAreaCode?: string;
  PhoneCountryCode?: string;
};

export type XeroContact = {
  ContactID: string;
  Name: string;
  EmailAddress?: string;
  Phones?: XeroPhone[];
  IsCustomer?: boolean;
};

export type XeroLineItem = {
  Description?: string;
  Quantity?: number;
  UnitAmount?: number;
  AccountCode?: string;
};

export type XeroInvoice = {
  InvoiceID: string;
  InvoiceNumber?: string;
  Type: "ACCREC" | "ACCPAY";
  Reference?: string;
  Date: string; // YYYY-MM-DD or /Date(epoch)/
  DueDate?: string;
  AmountDue: number;
  AmountPaid: number;
  Total: number;
  Status:
    | "DRAFT"
    | "SUBMITTED"
    | "AUTHORISED"
    | "PAID"
    | "VOIDED"
    | "DELETED";
  Contact: { ContactID: string; Name?: string };
  FullyPaidOnDate?: string;
  UpdatedDateUTC?: string;
};

export type XeroPayment = {
  PaymentID: string;
  Date: string;
  Amount: number;
  Reference?: string;
  Status: "AUTHORISED" | "DELETED";
  Invoice: { InvoiceID: string };
};

// Xero returns dates in /Date(milliseconds+offset)/ shape on JSON API; we ask for
// the friendlier ISO format via the unitdp / If-Modified-Since approach. For now
// we just normalize either form when we hit it.
export function parseXeroDate(s: string | undefined): string | null {
  if (!s) return null;
  const m = /\/Date\((-?\d+)/.exec(s);
  if (m) {
    const ms = Number(m[1]);
    return new Date(ms).toISOString().slice(0, 10);
  }
  // Already an ISO date string
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

const PAGE_SIZE = 100;

export async function listCustomers(
  conn: XeroConnectionRow,
): Promise<XeroContact[]> {
  const out: XeroContact[] = [];
  for (let page = 1; ; page++) {
    const resp = await xeroFetch<{ Contacts: XeroContact[] }>(
      conn,
      `/Contacts?where=${encodeURIComponent('IsCustomer==true')}&page=${page}&pageSize=${PAGE_SIZE}`,
    );
    const rows = resp.Contacts ?? [];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}

export async function listOpenInvoices(
  conn: XeroConnectionRow,
): Promise<XeroInvoice[]> {
  const out: XeroInvoice[] = [];
  for (let page = 1; ; page++) {
    const where = encodeURIComponent(
      'Type=="ACCREC" AND AmountDue > 0 AND Status!="VOIDED" AND Status!="DELETED"',
    );
    const resp = await xeroFetch<{ Invoices: XeroInvoice[] }>(
      conn,
      `/Invoices?where=${where}&page=${page}&pageSize=${PAGE_SIZE}`,
    );
    const rows = resp.Invoices ?? [];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}

export async function listPaidInvoicesSince(
  conn: XeroConnectionRow,
  sinceIso: string,
): Promise<XeroInvoice[]> {
  const out: XeroInvoice[] = [];
  for (let page = 1; ; page++) {
    const where = encodeURIComponent(
      `Type=="ACCREC" AND Status=="PAID" AND FullyPaidOnDate >= DateTime(${sinceIso.slice(0, 4)}, ${sinceIso.slice(5, 7)}, ${sinceIso.slice(8, 10)})`,
    );
    const resp = await xeroFetch<{ Invoices: XeroInvoice[] }>(
      conn,
      `/Invoices?where=${where}&page=${page}&pageSize=${PAGE_SIZE}`,
    );
    const rows = resp.Invoices ?? [];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}

export async function listOpenInvoicesForCustomer(
  conn: XeroConnectionRow,
  contactId: string,
): Promise<XeroInvoice[]> {
  const where = encodeURIComponent(
    `Type=="ACCREC" AND AmountDue > 0 AND Contact.ContactID == GUID("${contactId}")`,
  );
  const resp = await xeroFetch<{ Invoices: XeroInvoice[] }>(
    conn,
    `/Invoices?where=${where}&pageSize=${PAGE_SIZE}`,
  );
  return resp.Invoices ?? [];
}

export type XeroPaymentInput = {
  invoiceId: string;
  amount: number; // in dollars (Xero uses decimals, not cents)
  bankAccountCode?: string; // optional account code; Xero will pick a default if omitted
  reference?: string;
};

export async function recordPayment(
  conn: XeroConnectionRow,
  input: XeroPaymentInput,
): Promise<{ paymentId: string }> {
  // Xero requires either Account.Code or Account.AccountID for the deposit
  // account; if the org hasn't told us a bank code, fall back to "BANK" which
  // matches the default Xero "Business Bank Account" code on most ledgers.
  const account = input.bankAccountCode
    ? { Code: input.bankAccountCode }
    : { Code: "090" };
  const body = {
    Payments: [
      {
        Invoice: { InvoiceID: input.invoiceId },
        Account: account,
        Date: new Date().toISOString().slice(0, 10),
        Amount: input.amount,
        Reference: input.reference,
      },
    ],
  };
  const resp = await xeroFetch<{
    Payments: { PaymentID: string }[];
  }>(conn, "/Payments", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const id = resp.Payments?.[0]?.PaymentID;
  if (!id) throw new Error("Xero payment created but no ID returned");
  return { paymentId: id };
}
