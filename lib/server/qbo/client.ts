import "server-only";
import { decryptToken, encryptToken } from "../crypto";
import { upsertConnection } from "../db/connections";
import type { QboConnectionRow } from "../db/schema";
import { QBO_API_BASE, QBO_MINOR_VERSION } from "./config";
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
  });
  return refreshed.access_token;
}

export async function qboQuery<T>(
  conn: QboConnectionRow,
  query: string,
): Promise<T> {
  const token = await getValidAccessToken(conn);
  const url = new URL(`${QBO_API_BASE}/v3/company/${conn.realmId}/query`);
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

export type QboCustomer = {
  Id: string;
  DisplayName: string;
  Active?: boolean;
  PrimaryPhone?: { FreeFormNumber?: string };
  Mobile?: { FreeFormNumber?: string };
};

export type QboInvoice = {
  Id: string;
  CustomerRef: { value: string; name?: string };
  Balance: number;
  TotalAmt: number;
  TxnDate: string;
  DueDate?: string;
};

type QueryResponse<K extends string, T> = {
  QueryResponse: { [P in K]?: T[] } & { startPosition?: number; maxResults?: number };
};

export async function listCustomers(
  conn: QboConnectionRow,
): Promise<QboCustomer[]> {
  const data = await qboQuery<QueryResponse<"Customer", QboCustomer>>(
    conn,
    "SELECT Id, DisplayName, Active, PrimaryPhone, Mobile FROM Customer WHERE Active = true MAXRESULTS 1000",
  );
  return data.QueryResponse.Customer ?? [];
}

export async function listOpenInvoices(
  conn: QboConnectionRow,
): Promise<QboInvoice[]> {
  const data = await qboQuery<QueryResponse<"Invoice", QboInvoice>>(
    conn,
    "SELECT Id, CustomerRef, Balance, TotalAmt, TxnDate, DueDate FROM Invoice WHERE Balance > '0' MAXRESULTS 1000",
  );
  return data.QueryResponse.Invoice ?? [];
}
