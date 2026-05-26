import "server-only";
import { getJobberConfig } from "../env";
import { JOBBER_TOKEN_URL } from "./config";

export type JobberTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: "Bearer";
  scope?: string;
};

export async function exchangeCodeForTokens(
  code: string,
): Promise<JobberTokenResponse> {
  const cfg = getJobberConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
  });
  const res = await fetch(JOBBER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Jobber token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as JobberTokenResponse;
}

export async function refreshTokens(
  refreshToken: string,
): Promise<JobberTokenResponse> {
  const cfg = getJobberConfig();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  });
  const res = await fetch(JOBBER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Jobber token refresh failed: ${res.status} ${text}`);
  }
  return (await res.json()) as JobberTokenResponse;
}
