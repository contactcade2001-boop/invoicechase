import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getServiceTitanConfig } from "@/lib/server/env";
import {
  ST_AUTH_URL,
  ST_SCOPES,
  ST_STATE_COOKIE,
} from "@/lib/server/servicetitan/oauth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  if (user.role !== "owner") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  const cfg = getServiceTitanConfig();
  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: ST_SCOPES,
    state,
  });
  const res = NextResponse.redirect(`${ST_AUTH_URL}?${params.toString()}`);
  res.cookies.set(ST_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
