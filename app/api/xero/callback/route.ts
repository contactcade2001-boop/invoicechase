import { redirectUrl } from "@/lib/server/urls";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { encryptToken } from "@/lib/server/crypto";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import { upsertXeroConnection } from "@/lib/server/db/xeroConnections";
import { invalidateDashboardCache, warmDashboardCache } from "@/lib/server/qbo/sync";
import { XERO_STATE_COOKIE } from "@/lib/server/xero/config";
import {
  exchangeCodeForTokens,
  listTenants,
} from "@/lib/server/xero/oauth";

export const dynamic = "force-dynamic";

function errorRedirect(req: NextRequest, message: string) {
  const url = redirectUrl(req, "/dashboard");
  url.searchParams.set("xero_error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(redirectUrl(req, "/login"));
  if (user.role !== "owner") {
    return NextResponse.redirect(redirectUrl(req, "/dashboard"));
  }
  const orgId = user.organizationId!;

  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const xeroError = params.get("error");

  if (xeroError) return errorRedirect(req, xeroError);
  if (!code || !state) return errorRedirect(req, "missing_params");

  const cookieState = req.cookies.get(XERO_STATE_COOKIE)?.value;
  if (!cookieState || cookieState !== state) {
    return errorRedirect(req, "state_mismatch");
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (err) {
    console.error("[xero] token exchange failed", err);
    return errorRedirect(req, "token_exchange_failed");
  }

  // Xero may return multiple tenants if the user authorized more than one
  // organisation. Pick the first one — most SMBs only have one.
  let tenants;
  try {
    tenants = await listTenants(tokens.access_token);
  } catch (err) {
    console.error("[xero] list tenants failed", err);
    return errorRedirect(req, "list_tenants_failed");
  }
  const tenant = tenants[0];
  if (!tenant) return errorRedirect(req, "no_tenant");

  const now = Date.now();
  upsertXeroConnection({
    organizationId: orgId,
    tenantId: tenant.tenantId,
    tenantName: tenant.tenantName,
    accessTokenEnc: encryptToken(tokens.access_token),
    refreshTokenEnc: encryptToken(tokens.refresh_token),
    accessTokenExpiresAt: now + tokens.expires_in * 1000,
    // Xero refresh tokens last 60 days from issue.
    refreshTokenExpiresAt: now + 60 * 24 * 60 * 60 * 1000,
  });

  logAuditEvent({
    organizationId: orgId,
    userId: user.id,
    actorEmail: user.email,
    kind: "xero.connected",
    targetType: "tenant",
    targetId: tenant.tenantId,
    metadata: { tenantName: tenant.tenantName },
  });

  // Bust + warm the cache so /dashboard reflects Xero data immediately.
  invalidateDashboardCache(orgId);
  void warmDashboardCache(orgId);

  const res = NextResponse.redirect(
    redirectUrl(req, "/dashboard?xero_connected=1"),
  );
  res.cookies.delete(XERO_STATE_COOKIE);
  return res;
}
