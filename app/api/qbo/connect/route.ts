import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { STATE_COOKIE } from "@/lib/server/qbo/config";
import { buildAuthorizeUrl } from "@/lib/server/qbo/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildAuthorizeUrl(state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
