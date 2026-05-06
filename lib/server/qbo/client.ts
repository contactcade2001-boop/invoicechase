import "server-only";
import { decryptToken, encryptToken } from "../crypto";
import { upsertConnection } from "../db/connections";
import type { QboConnectionRow } from "../db/schema";
import {
  QBO_MINOR_VERSION,
  QBO_PAGE_SIZE,
  getQboApiBase,
} from "./config";
import { refreshAccessToken } from "./oauth";

const REFRESH_BUFFER_MS = 60_000;

async function getValidAccessToken(conn: QboConnectionRow): Promise<string> {
  if (conn.accessTokenExpiresAt - Date.now() > REFRESH_BUFFER_MS) {
    return decryptToken(conn.accessTokenEnc);
  }
  const refreshed = await refreshAccessToken(decryptToken(conn.refreshTokenEnc));
  const now = Date.now();
  upsertConnection({
    realmId: conn.realmId,
    companyName: conn.companyName,
    accessTokenEnc: encryptToken(refreshed.access_token),
    refreshTokenEnc: encryptToken(refreshed.refresh_token),
    accessTokenExpiresAt: now + refreshed.expires_in * 1000,
    refreshTokenExpiresAt: now + refreshed.x_refresh_token_expires_in * 1000,
    organizationId: conn.organizationId,
  });
  return refreshed.access_token;
}

export async function qboQuery<T>(
  conn: QboConnectionRow,
  query: string,
): Promise<T> {
  const token = await getValidAccessToken(conn);
  const url = new URL(`${getQboApiBase()}/v3/company/${conn.realmId}/query`);
  url.searchParams.set("query", query);
  url.searchParams.set("minorversion", QBO_MINOR_VERSION);
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`QBO query failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export async function qboPost<T>(
  conn: QboConnectionRow,
  path: string,
  body: unknown,
): Promise<T> {
  const token = await getValidAccessToken(conn);
  const url = new URL(`${getQboApiBase()}/v3/company/${conn.realmId}${path}`);
  url.searchParams.set("minorversion", QBO_MINOR_VERSION);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `QBO POST ${path} failed: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as T;
}

function safeQboId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

export type QboCustomer = {
  Id: string;
  DisplayName: string;
  Active?: boolean;
  PrimaryPhone?: { FreeFormNumber?: string };
  Mobile?: { FreeFormNumber?: string };
  PrimaryEmailAddr?: { Address?: string };
};

export type QboInvoice = {
  Id: string;
  DocNumber?: string;
  CustomerRef: { value: string; name?: string };
  Balance: number;
  TotalAmt: number;
  TxnDate: string;
  DueDate?: string;
};

export type QboPaymentLine = {
  Amount?: number;
  LinkedTxn?: Array<{ TxnId: string; TxnType: string }>;
};

export type QboPayment = {
  Id: string;
  CustomerRef: { value: string };
  TxnDate: string;
  TotalAmt: number;
  Line?: QboPaymentLine[];
};

type QueryResponse<K extends string, T> = {
  QueryResponse: { [P in K]?: T[] } & {
    startPosition?: number;
    maxResults?: number;
  };
};

const MAX_PAGES = 50;

async function paginate<K extends string, T>(
  conn: QboConnectionRow,
  key: K,
  selectQuery: string,
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const start = page * QBO_PAGE_SIZE + 1;
    const data = await qboQuery<QueryResponse<K, T>>(
      conn,
      `${selectQuery} STARTPOSITION ${start} MAXRESULTS ${QBO_PAGE_SIZE}`,
    );
    const rows = (data.QueryResponse[key] ?? []) as T[];
    out.push(...rows);
    if (rows.length < QBO_PAGE_SIZE) break;
  }
  return out;
}

export async function listCustomers(
  conn: QboConnectionRow,
): Promise<QboCustomer[]> {
  return paginate<"Customer", QboCustomer>(
    conn,
    "Customer",
    "SELECT Id, DisplayName, Active, PrimaryPhone, Mobile, PrimaryEmailAddr FROM Customer WHERE Active = true",
  );
}

export async function listOpenInvoices(
  conn: QboConnectionRow,
): Promise<QboInvoice[]> {
  return paginate<"Invoice", QboInvoice>(
    conn,
    "Invoice",
    "SELECT Id, DocNumber, CustomerRef, Balance, TotalAmt, TxnDate, DueDate FROM Invoice WHERE Balance > '0'",
  );
}

export async function listOpenInvoicesForCustomer(
  conn: QboConnectionRow,
  customerId: string,
): Promise<QboInvoice[]> {
  const safeId = safeQboId(customerId);
  return paginate<"Invoice", QboInvoice>(
    conn,
    "Invoice",
    `SELECT Id, DocNumber, CustomerRef, Balance, TotalAmt, TxnDate, DueDate FROM Invoice WHERE Balance > '0' AND CustomerRef = '${safeId}' ORDERBY TxnDate ASC`,
  );
}

export async function listPaidInvoicesSince(
  conn: QboConnectionRow,
  sinceIso: string,
): Promise<QboInvoice[]> {
  return paginate<"Invoice", QboInvoice>(
    conn,
    "Invoice",
    `SELECT Id, DocNumber, CustomerRef, Balance, TotalAmt, TxnDate, DueDate FROM Invoice WHERE Balance = '0' AND TxnDate >= '${sinceIso}'`,
  );
}

export async function listPaymentsSince(
  conn: QboConnectionRow,
  sinceIso: string,
): Promise<QboPayment[]> {
  return paginate<"Payment", QboPayment>(
    conn,
    "Payment",
    `SELECT Id, CustomerRef, TxnDate, TotalAmt, Line FROM Payment WHERE TxnDate >= '${sinceIso}'`,
  );
}
