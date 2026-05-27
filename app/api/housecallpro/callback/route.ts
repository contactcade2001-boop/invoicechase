import { redirectUrl } from "@/lib/server/urls";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { encryptToken } from "@/lib/server/crypto";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import { upsertHousecallProConnection } from "@/lib/server/db/fsmConnections";
import { invalidateDashboardCache } from "@/lib/server/qbo/sync";
import { HCP_STATE_COOKIE } from "@/lib/server/housecallpro/oauth";
import { exchangeCodeForTokens } from "@/lib/server/housecallpro/oauth";

export const dynamic = "force-dynamic";

function errorRedirect(req: NextRequest, message: string) {
  const url = redirectUrl(req, "/dashboard");
  url.searchParams.set("hcp_error", message);
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
  if (err) return errorRedirect(req, err);
  if (!code || !state) return errorRedirect(req, "missing_params");

  const cookieState = req.cookies.get(HCP_STATE_COOKIE)?.value;
  if (!cookieState || cookieState !== state) {
    return errorRedirect(req, "state_mismatch");
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (e) {
    console.error("[housecallpro] token exchange failed", e);
    return errorRedirect(req, "token_exchange_failed");
  }

  const now = Date.now();
  upsertHousecallProConnection({
    organizationId: orgId,
    accountId: null,
    accountName: null,
    accessTokenEnc: encryptToken(tokens.access_token),
    refreshTokenEnc: tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null,
    accessTokenExpiresAt: now + tokens.expires_in * 1000,
    refreshTokenExpiresAt: tokens.refresh_token
      ? now + 60 * 24 * 60 * 60 * 1000
      : null,
  });

  logAuditEvent({
    organizationId: orgId,
    userId: user.id,
    actorEmail: user.email,
    kind: "fsm.connected",
    targetType: "housecallpro",
    targetId: String(orgId),
  });

  invalidateDashboardCache(orgId);
  const res = NextResponse.redirect(
    redirectUrl(req, "/dashboard?hcp_connected=1"),
  );
  res.cookies.delete(HCP_STATE_COOKIE);
  return res;
}
