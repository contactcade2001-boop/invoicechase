import "server-only";
import { getAppBaseUrl } from "../env";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export type GoogleProfile = {
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
};

function getConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google sign-in is not configured.");
  }
  return {
    clientId,
    clientSecret,
    redirectUri: `${getAppBaseUrl()}/api/auth/google/callback`,
  };
}

export function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function buildGoogleAuthUrl(state: string): string {
  const cfg = getConfig();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
};

export async function exchangeCodeForProfile(
  code: string,
): Promise<GoogleProfile> {
  const cfg = getConfig();
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${tokenRes.status} ${body}`);
  }
  const token = (await tokenRes.json()) as TokenResponse;

  const userRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!userRes.ok) {
    const body = await userRes.text();
    throw new Error(`Google userinfo failed: ${userRes.status} ${body}`);
  }
  const u = (await userRes.json()) as {
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!u.email) throw new Error("Google account has no email.");
  return {
    email: u.email.toLowerCase(),
    emailVerified: u.email_verified === true,
    name: u.name,
    picture: u.picture,
  };
}
