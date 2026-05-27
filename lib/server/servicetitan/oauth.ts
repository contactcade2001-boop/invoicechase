import "server-only";
import { getServiceTitanConfig } from "../env";

// ServiceTitan endpoints — verify against the partner portal once your
// app is approved. Their API also requires a tenant_id in every API call.
export const ST_AUTH_URL = "https://auth.servicetitan.io/connect/authorize";
export const ST_TOKEN_URL = "https://auth.servicetitan.io/connect/token";
export const ST_API_BASE = "https://api.servicetitan.io";

export const ST_SCOPES = ["openid", "offline_access", "tenant"].join(" ");

export const ST_STATE_COOKIE = "st_oauth_state";

export type StTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
};

export async function exchangeCodeForTokens(
  code: string,
): Promise<StTokenResponse> {
  const cfg = getServiceTitanConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
  });
  const res = await fetch(ST_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ServiceTitan token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as StTokenResponse;
}
