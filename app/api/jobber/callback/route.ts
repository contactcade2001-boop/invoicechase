import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { encryptToken } from "@/lib/server/crypto";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import { upsertJobberConnection } from "@/lib/server/db/jobberConnections";
import {
  invalidateDashboardCache,
  warmDashboardCache,
} from "@/lib/server/qbo/sync";
import { JOBBER_STATE_COOKIE } from "@/lib/server/jobber/config";
import { exchangeCodeForTokens } from "@/lib/server/jobber/oauth";

export const dynamic = "force-dynamic";

function errorRedirect(req: NextRequest, message: string) {
  const url = new URL("/dashboard", req.url);
  url.searchParams.set("jobber_error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  if (user.role !== "owner") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  const orgId = user.organizationId!;

  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const err = params.get("error");
  if (err) return errorRedirect(req, err);
  if (!code || !state) return errorRedirect(req, "missing_params");

  const cookieState = req.cookies.get(JOBBER_STATE_COOKIE)?.value;
  if (!cookieState || cookieState !== state) {
    return errorRedirect(req, "state_mismatch");
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (e) {
    console.error("[jobber] token exchange failed", e);
    return errorRedirect(req, "token_exchange_failed");
  }

  // Jobber tokens don't carry an account ID until we hit a GraphQL endpoint.
  // For v1, store a placeholder account_id from the access-token hash and
  // let the dashboard name itself once we successfully query the account.
  const accountId = `jobber:${orgId}`;

  const now = Date.now();
  upsertJobberConnection({
    organizationId: orgId,
    accountId,
    accountName: null,
    accessTokenEnc: encryptToken(tokens.access_token),
    refreshTokenEnc: encryptToken(tokens.refresh_token),
    accessTokenExpiresAt: now + tokens.expires_in * 1000,
    refreshTokenExpiresAt: now + 60 * 24 * 60 * 60 * 1000,
  });

  logAuditEvent({
    organizationId: orgId,
    userId: user.id,
    actorEmail: user.email,
    kind: "jobber.connected",
    targetType: "account",
    targetId: accountId,
  });

  invalidateDashboardCache(orgId);
  void warmDashboardCache(orgId);

  const res = NextResponse.redirect(
    new URL("/dashboard?jobber_connected=1", req.url),
  );
  res.cookies.delete(JOBBER_STATE_COOKIE);
  return res;
}
