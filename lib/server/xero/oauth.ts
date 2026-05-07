import "server-only";
import { getXeroConfig } from "../env";
import {
  XERO_CONNECTIONS_URL,
  XERO_REVOKE_URL,
  XERO_TOKEN_URL,
} from "./config";

export type XeroTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: "Bearer";
  scope: string;
  // Xero refresh tokens are valid for 60 days from issue, replaced on each refresh.
};

export type XeroTenant = {
  id: string;
  authEventId: string;
  tenantId: string;
  tenantType: "ORGANISATION" | string;
  tenantName: string;
  createdDateUtc: string;
  updatedDateUtc: string;
};

function basicAuthHeader(): string {
  const cfg = getXeroConfig();
  const raw = `${cfg.clientId}:${cfg.clientSecret}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<XeroTokenResponse> {
  const cfg = getXeroConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri,
  });
  const res = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Xero token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as XeroTokenResponse;
}

export async function refreshTokens(
  refreshToken: string,
): Promise<XeroTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Xero token refresh failed: ${res.status} ${text}`);
  }
  return (await res.json()) as XeroTokenResponse;
}

export async function revokeToken(refreshToken: string): Promise<void> {
  const body = new URLSearchParams({ token: refreshToken });
  await fetch(XERO_REVOKE_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
}

export async function listTenants(accessToken: string): Promise<XeroTenant[]> {
  const res = await fetch(XERO_CONNECTIONS_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Xero list tenants failed: ${res.status} ${text}`);
  }
  return (await res.json()) as XeroTenant[];
}
