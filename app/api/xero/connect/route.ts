import { redirectUrl } from "@/lib/server/urls";
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getXeroConfig } from "@/lib/server/env";
import {
  XERO_AUTH_URL,
  XERO_SCOPES,
  XERO_STATE_COOKIE,
} from "@/lib/server/xero/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(redirectUrl(req, "/login"));
  }
  if (user.role !== "owner") {
    return NextResponse.redirect(redirectUrl(req, "/dashboard"));
  }

  const cfg = getXeroConfig();
  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: XERO_SCOPES,
    state,
  });
  const res = NextResponse.redirect(`${XERO_AUTH_URL}?${params.toString()}`);
  res.cookies.set(XERO_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
