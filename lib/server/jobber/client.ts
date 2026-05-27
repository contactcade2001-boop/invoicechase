import "server-only";
import { decryptToken, encryptToken } from "../crypto";
import {
  getJobberConnectionForOrg,
  upsertJobberConnection,
} from "../db/jobberConnections";
import type { JobberConnectionRow } from "../db/schema";
import { refreshTokens } from "./oauth";
import { JOBBER_GRAPHQL_URL, JOBBER_GRAPHQL_VERSION } from "./config";

const REFRESH_LEEWAY_MS = 5 * 60 * 1000;

async function ensureFreshAccessToken(
  conn: JobberConnectionRow,
): Promise<string> {
  if (conn.accessTokenExpiresAt > Date.now() + REFRESH_LEEWAY_MS) {
    return decryptToken(conn.accessTokenEnc);
  }
  const refresh = decryptToken(conn.refreshTokenEnc);
  const fresh = await refreshTokens(refresh);
  const now = Date.now();
  upsertJobberConnection({
    organizationId: conn.organizationId,
    accountId: conn.accountId,
    accountName: conn.accountName,
    accessTokenEnc: encryptToken(fresh.access_token),
    refreshTokenEnc: encryptToken(fresh.refresh_token),
    accessTokenExpiresAt: now + fresh.expires_in * 1000,
    // Jobber refresh tokens are valid for 60 days; conservative.
    refreshTokenExpiresAt: now + 60 * 24 * 60 * 60 * 1000,
  });
  return fresh.access_token;
}

async function graphql<T>(
  conn: JobberConnectionRow,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const accessToken = await ensureFreshAccessToken(conn);
  const res = await fetch(JOBBER_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-JOBBER-GRAPHQL-VERSION": JOBBER_GRAPHQL_VERSION,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Jobber GraphQL ${res.status}: ${text}`);
  }
  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (json.errors && json.errors.length > 0) {
    throw new Error(
      `Jobber GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`,
    );
  }
  if (!json.data) throw new Error("Jobber GraphQL returned no data");
  return json.data;
}

export type JobberAddress = {
  street?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type JobberClient = {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  emails?: { description?: string | null; address: string }[];
  phones?: { description?: string | null; number: string }[];
  billingAddress?: JobberAddress | null;
};

export type JobberInvoice = {
  id: string;
  invoiceNumber?: string | null;
  issuedDate?: string | null; // YYYY-MM-DD
  dueDate?: string | null;
  invoiceStatus: string;
  amounts: {
    total: number;
    subtotal: number;
    paymentAmount: number;
    balance: number;
  };
  client: { id: string };
};

type PageInfo = { hasNextPage: boolean; endCursor: string | null };

const CLIENTS_QUERY = `
  query Clients($after: String) {
    clients(first: 100, after: $after) {
      edges { node {
        id
        name
        firstName
        lastName
        companyName
        emails { description address }
        phones { description number }
        billingAddress { street city province postalCode country }
      } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

type ClientsPage = {
  clients: { edges: { node: JobberClient }[]; pageInfo: PageInfo };
};

export async function listClients(
  conn: JobberConnectionRow,
): Promise<JobberClient[]> {
  const out: JobberClient[] = [];
  let after: string | null = null;
  for (let i = 0; i < 100; i++) {
    const resp: ClientsPage = await graphql<ClientsPage>(
      conn,
      CLIENTS_QUERY,
      { after },
    );
    for (const e of resp.clients.edges) out.push(e.node);
    if (!resp.clients.pageInfo.hasNextPage) break;
    after = resp.clients.pageInfo.endCursor;
  }
  return out;
}

const INVOICES_QUERY = `
  query Invoices($after: String) {
    invoices(first: 100, after: $after, filter: { invoiceStatus: { in: [AWAITING_PAYMENT, PAST_DUE, PARTIALLY_PAID] } }) {
      edges { node {
        id
        invoiceNumber
        issuedDate
        dueDate
        invoiceStatus
        amounts { total subtotal paymentAmount balance }
        client { id }
      } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

type InvoicesPage = {
  invoices: { edges: { node: JobberInvoice }[]; pageInfo: PageInfo };
};

export async function listOpenInvoices(
  conn: JobberConnectionRow,
): Promise<JobberInvoice[]> {
  const out: JobberInvoice[] = [];
  let after: string | null = null;
  for (let i = 0; i < 100; i++) {
    const resp: InvoicesPage = await graphql<InvoicesPage>(
      conn,
      INVOICES_QUERY,
      { after },
    );
    for (const e of resp.invoices.edges) {
      // Defensive: balance > 0 filters out edge cases where status filter
      // returns a fully-paid edge.
      if ((e.node.amounts?.balance ?? 0) > 0) out.push(e.node);
    }
    if (!resp.invoices.pageInfo.hasNextPage) break;
    after = resp.invoices.pageInfo.endCursor;
  }
  return out;
}

const PAID_INVOICES_QUERY = `
  query PaidInvoices($after: String, $startDate: ISO8601Date) {
    invoices(first: 100, after: $after, filter: {
      invoiceStatus: { eq: PAID }
      issuedDate: { gte: $startDate }
    }) {
      edges { node {
        id
        invoiceNumber
        issuedDate
        dueDate
        invoiceStatus
        amounts { total subtotal paymentAmount balance }
        client { id }
      } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export async function listPaidInvoicesSince(
  conn: JobberConnectionRow,
  sinceIso: string,
): Promise<JobberInvoice[]> {
  const out: JobberInvoice[] = [];
  let after: string | null = null;
  for (let i = 0; i < 100; i++) {
    const resp: InvoicesPage = await graphql<InvoicesPage>(
      conn,
      PAID_INVOICES_QUERY,
      { after, startDate: sinceIso },
    );
    for (const e of resp.invoices.edges) out.push(e.node);
    if (!resp.invoices.pageInfo.hasNextPage) break;
    after = resp.invoices.pageInfo.endCursor;
  }
  return out;
}

const INVOICES_FOR_CLIENT_QUERY = `
  query InvoicesForClient($after: String, $clientId: EncodedId!) {
    invoices(first: 100, after: $after, filter: {
      client: { id: { eq: $clientId } }
      invoiceStatus: { in: [AWAITING_PAYMENT, PAST_DUE, PARTIALLY_PAID] }
    }) {
      edges { node {
        id
        invoiceNumber
        issuedDate
        dueDate
        invoiceStatus
        amounts { total subtotal paymentAmount balance }
        client { id }
      } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export async function listOpenInvoicesForClient(
  conn: JobberConnectionRow,
  clientId: string,
): Promise<JobberInvoice[]> {
  const out: JobberInvoice[] = [];
  let after: string | null = null;
  for (let i = 0; i < 100; i++) {
    const resp: InvoicesPage = await graphql<InvoicesPage>(
      conn,
      INVOICES_FOR_CLIENT_QUERY,
      { after, clientId },
    );
    for (const e of resp.invoices.edges) {
      if ((e.node.amounts?.balance ?? 0) > 0) out.push(e.node);
    }
    if (!resp.invoices.pageInfo.hasNextPage) break;
    after = resp.invoices.pageInfo.endCursor;
  }
  return out;
}

const CREATE_PAYMENT_MUTATION = `
  mutation CreatePayment($input: InvoicePaymentCreateInput!) {
    invoicePaymentCreate(input: $input) {
      payment { id }
      userErrors { message }
    }
  }
`;

export type JobberPaymentInput = {
  invoiceId: string;
  amount: number; // dollars
  reference?: string;
  paymentDate?: string; // YYYY-MM-DD; defaults to today
};

export async function recordPayment(
  conn: JobberConnectionRow,
  input: JobberPaymentInput,
): Promise<{ paymentId: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const resp = await graphql<{
    invoicePaymentCreate: {
      payment: { id: string } | null;
      userErrors: { message: string }[];
    };
  }>(conn, CREATE_PAYMENT_MUTATION, {
    input: {
      invoiceId: input.invoiceId,
      amount: input.amount,
      paymentDate: input.paymentDate ?? today,
      note: input.reference,
      paymentMethod: "OTHER",
    },
  });
  const errs = resp.invoicePaymentCreate.userErrors;
  if (errs && errs.length > 0) {
    throw new Error(
      `Jobber payment user errors: ${errs.map((e) => e.message).join("; ")}`,
    );
  }
  const id = resp.invoicePaymentCreate.payment?.id;
  if (!id) throw new Error("Jobber payment created but no ID returned");
  return { paymentId: id };
}
