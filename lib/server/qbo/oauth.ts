import "server-only";
import { getQboConfig } from "../env";
import {
  QBO_AUTH_URL,
  QBO_REVOKE_URL,
  QBO_SCOPE,
  QBO_TOKEN_URL,
} from "./config";

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  token_type: string;
};

export function buildAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getQboConfig();
  const url = new URL(QBO_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", QBO_SCOPE);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

function basicAuthHeader(): string {
  const { clientId, clientSecret } = getQboConfig();
  return (
    "Basic " +
    Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  );
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<TokenResponse> {
  const { redirectUri } = getQboConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `QBO token exchange failed: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `QBO token refresh failed: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as TokenResponse;
}

export async function revokeToken(token: string): Promise<void> {
  const res = await fetch(QBO_REVOKE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: basicAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
    cache: "no-store",
  });
  if (!res.ok && res.status !== 401) {
    // 401 = token already invalid, treat as success
    throw new Error(
      `QBO revoke failed: ${res.status} ${await res.text()}`,
    );
  }
}
