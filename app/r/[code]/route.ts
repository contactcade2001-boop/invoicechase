import { NextResponse, type NextRequest } from "next/server";
import { findPartnerByCode } from "@/lib/server/db/partners";
import { isValidCodeShape } from "@/lib/server/partners/code";
import {
  REFERRAL_COOKIE,
  referralCookieAttrs,
} from "@/lib/server/partners/cookie";

export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;

export async function GET(req: NextRequest, ctx: { params: Params }) {
  const { code: raw } = await ctx.params;
  const code = (raw ?? "").toLowerCase().trim();

  // Always redirect to the landing page so an invalid link still feels like
  // a normal click. We just don't drop a cookie.
  const dest = new URL("/", req.url);

  if (!isValidCodeShape(code)) {
    return NextResponse.redirect(dest);
  }
  const partner = findPartnerByCode(code);
  if (!partner || partner.status !== "active") {
    return NextResponse.redirect(dest);
  }

  const res = NextResponse.redirect(dest);
  const attrs = referralCookieAttrs();
  res.cookies.set({
    name: REFERRAL_COOKIE,
    value: code,
    maxAge: attrs.maxAge,
    httpOnly: attrs.httpOnly,
    sameSite: attrs.sameSite,
    secure: attrs.secure,
    path: attrs.path,
  });
  return res;
}
