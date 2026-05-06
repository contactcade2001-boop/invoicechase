import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { encryptToken } from "@/lib/server/crypto";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import { upsertConnection } from "@/lib/server/db/connections";
import { getQboApiBase, QBO_MINOR_VERSION, STATE_COOKIE } from "@/lib/server/qbo/config";
import { exchangeCodeForTokens } from "@/lib/server/qbo/oauth";
import { warmDashboardCache } from "@/lib/server/qbo/sync";

export const dynamic = "force-dynamic";

async function fetchCompanyName(
  accessToken: string,
  realmId: string,
): Promise<string | null> {
  const url = `${getQboApiBase()}/v3/company/${realmId}/companyinfo/${realmId}?minorversion=${QBO_MINOR_VERSION}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    CompanyInfo?: { CompanyName?: string };
  };
  return json.CompanyInfo?.CompanyName ?? null;
}

function errorRedirect(req: NextRequest, message: string) {
  const url = new URL("/dashboard", req.url);
  url.searchParams.set("qbo_error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (user.role !== "owner") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  const orgId = user.organizationId!;

  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const realmId = params.get("realmId");
  const intuitError = params.get("error");

  if (intuitError) {
    return errorRedirect(req, intuitError);
  }
  if (!code || !state || !realmId) {
    return errorRedirect(req, "missing_params");
  }

  const cookieState = req.cookies.get(STATE_COOKIE)?.value;
  if (!cookieState || cookieState !== state) {
    return errorRedirect(req, "state_mismatch");
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (err) {
    console.error("[qbo] token exchange failed", err);
    return errorRedirect(req, "token_exchange_failed");
  }

  const companyName = await fetchCompanyName(tokens.access_token, realmId);

  const now = Date.now();
  upsertConnection({
    organizationId: orgId,
    realmId,
    companyName,
    accessTokenEnc: encryptToken(tokens.access_token),
    refreshTokenEnc: encryptToken(tokens.refresh_token),
    accessTokenExpiresAt: now + tokens.expires_in * 1000,
    refreshTokenExpiresAt: now + tokens.x_refresh_token_expires_in * 1000,
  });

  logAuditEvent({
    organizationId: orgId,
    userId: user.id,
    actorEmail: user.email,
    kind: "qbo.connected",
    targetType: "realm",
    targetId: realmId,
    metadata: { companyName },
  });

  // Warm the dashboard cache asynchronously so the redirect to /dashboard
  // doesn't have to wait for the QBO query roundtrip.
  void warmDashboardCache(orgId);

  const res = NextResponse.redirect(
    new URL("/dashboard?qbo_connected=1", req.url),
  );
  res.cookies.delete(STATE_COOKIE);
  return res;
}
