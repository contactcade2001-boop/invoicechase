import "server-only";
import { getHousecallProConfig } from "../env";

// Per Housecall Pro's public developer docs — exact endpoints and scopes
// MUST be verified against your partner-portal app config before going live.
export const HCP_AUTH_URL = "https://app.housecallpro.com/oauth/authorize";
export const HCP_TOKEN_URL = "https://app.housecallpro.com/oauth/token";
export const HCP_API_BASE = "https://api.housecallpro.com";

export const HCP_SCOPES = [
  "customers:read",
  "invoices:read",
  "payments:write",
].join(" ");

export const HCP_STATE_COOKIE = "hcp_oauth_state";

export type HcpTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
};

export async function exchangeCodeForTokens(
  code: string,
): Promise<HcpTokenResponse> {
  const cfg = getHousecallProConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
  });
  const res = await fetch(HCP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Housecall Pro token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as HcpTokenResponse;
}
