import { redirectUrl } from "@/lib/server/urls";
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { STATE_COOKIE } from "@/lib/server/qbo/config";
import { buildAuthorizeUrl } from "@/lib/server/qbo/oauth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(redirectUrl(req, "/login"));
  }
  if (user.role !== "owner") {
    return NextResponse.redirect(redirectUrl(req, "/dashboard"));
  }
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
