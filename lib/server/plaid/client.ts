import "server-only";

const ENV_TO_HOST: Record<string, string> = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
};

function getConfig() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();
  const host = ENV_TO_HOST[env];
  if (!clientId || !secret || !host) {
    throw new Error("Plaid not configured");
  }
  return { clientId, secret, host, env };
}

export function isPlaidConfigured(): boolean {
  return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

async function call<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const cfg = getConfig();
  const res = await fetch(`${cfg.host}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      client_id: cfg.clientId,
      secret: cfg.secret,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Plaid ${path} ${res.status}: ${errBody}`);
  }
  return (await res.json()) as T;
}

export type LinkTokenResponse = { link_token: string; expiration: string };

export function createLinkToken(input: {
  userId: number;
  businessName: string;
}): Promise<LinkTokenResponse> {
  return call<LinkTokenResponse>("/link/token/create", {
    user: { client_user_id: String(input.userId) },
    client_name: input.businessName || "Invoice Chase",
    products: ["auth", "transactions"],
    country_codes: ["US"],
    language: "en",
    webhook: process.env.APP_BASE_URL
      ? `${process.env.APP_BASE_URL.replace(/\/$/, "")}/api/plaid/webhook`
      : undefined,
  });
}

export type ExchangeResponse = { access_token: string; item_id: string };

export function exchangePublicToken(publicToken: string): Promise<ExchangeResponse> {
  return call<ExchangeResponse>("/item/public_token/exchange", {
    public_token: publicToken,
  });
}

export type Account = {
  account_id: string;
  name: string;
  subtype: string | null;
  type: string;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string | null;
  };
};

export type BalanceResponse = {
  accounts: Account[];
  item: { institution_id: string | null };
};

export function fetchBalances(accessToken: string): Promise<BalanceResponse> {
  return call<BalanceResponse>("/accounts/balance/get", {
    access_token: accessToken,
  });
}

export type InstitutionResponse = {
  institution: { name: string };
};

export function fetchInstitution(
  institutionId: string,
): Promise<InstitutionResponse> {
  return call<InstitutionResponse>("/institutions/get_by_id", {
    institution_id: institutionId,
    country_codes: ["US"],
  });
}

export function removeItem(accessToken: string): Promise<unknown> {
  return call("/item/remove", { access_token: accessToken });
}

/**
 * Sum the "available" balance (or current if available is null) across all
 * depository accounts. Returns cents.
 */
export function sumDepositoryBalanceCents(accounts: Account[]): number {
  let total = 0;
  for (const a of accounts) {
    if (a.type !== "depository") continue;
    const bal = a.balances.available ?? a.balances.current ?? 0;
    total += Math.round(bal * 100);
  }
  return total;
}
