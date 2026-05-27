import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import {
  buildGoogleAuthUrl,
  isGoogleConfigured,
} from "@/lib/server/auth/google";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "ic_google_state";
const STATE_TTL_S = 10 * 60;

export async function GET(req: NextRequest) {
  if (!isGoogleConfigured()) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(url);
  }
  const state = randomBytes(24).toString("base64url");
  const authorizeUrl = buildGoogleAuthUrl(state);
  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STATE_TTL_S,
  });
  return res;
}
