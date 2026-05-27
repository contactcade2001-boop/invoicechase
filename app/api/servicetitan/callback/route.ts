import { redirectUrl } from "@/lib/server/urls";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { encryptToken } from "@/lib/server/crypto";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import { upsertServiceTitanConnection } from "@/lib/server/db/fsmConnections";
import { invalidateDashboardCache } from "@/lib/server/qbo/sync";
import { ST_STATE_COOKIE } from "@/lib/server/servicetitan/oauth";
import { exchangeCodeForTokens } from "@/lib/server/servicetitan/oauth";

export const dynamic = "force-dynamic";

function errorRedirect(req: NextRequest, message: string) {
  const url = redirectUrl(req, "/dashboard");
  url.searchParams.set("st_error", message);
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
  const err = params.get("error");
  const tenantId = params.get("tenant") ?? params.get("tenantId");
  if (err) return errorRedirect(req, err);
  if (!code || !state) return errorRedirect(req, "missing_params");
  if (!tenantId) return errorRedirect(req, "missing_tenant");

  const cookieState = req.cookies.get(ST_STATE_COOKIE)?.value;
  if (!cookieState || cookieState !== state) {
    return errorRedirect(req, "state_mismatch");
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (e) {
    console.error("[servicetitan] token exchange failed", e);
    return errorRedirect(req, "token_exchange_failed");
  }

  const now = Date.now();
  upsertServiceTitanConnection({
    organizationId: orgId,
    tenantId,
    tenantName: null,
    accessTokenEnc: encryptToken(tokens.access_token),
    refreshTokenEnc: tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null,
    accessTokenExpiresAt: now + tokens.expires_in * 1000,
    refreshTokenExpiresAt: tokens.refresh_token
      ? now + 30 * 24 * 60 * 60 * 1000
      : null,
  });

  logAuditEvent({
    organizationId: orgId,
    userId: user.id,
    actorEmail: user.email,
    kind: "fsm.connected",
    targetType: "servicetitan",
    targetId: tenantId,
  });

  invalidateDashboardCache(orgId);
  const res = NextResponse.redirect(
    redirectUrl(req, "/dashboard?st_connected=1"),
  );
  res.cookies.delete(ST_STATE_COOKIE);
  return res;
}
