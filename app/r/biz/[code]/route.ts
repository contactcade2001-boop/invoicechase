import { NextResponse, type NextRequest } from "next/server";
import { findOrgByCustomerReferralCode } from "@/lib/server/db/organizations";
import { isValidCodeShape } from "@/lib/server/partners/code";
import { referralCookieAttrs } from "@/lib/server/partners/cookie";

export const dynamic = "force-dynamic";

const ORG_REFERRAL_COOKIE = "ic_org_ref";

type Params = Promise<{ code: string }>;

export async function GET(req: NextRequest, ctx: { params: Params }) {
  const { code: raw } = await ctx.params;
  const code = (raw ?? "").toLowerCase().trim();
  const dest = new URL("/", req.url);
  if (!isValidCodeShape(code)) {
    return NextResponse.redirect(dest);
  }
  const referrer = findOrgByCustomerReferralCode(code);
  if (!referrer) {
    return NextResponse.redirect(dest);
  }
  const res = NextResponse.redirect(dest);
  const attrs = referralCookieAttrs();
  res.cookies.set({
    name: ORG_REFERRAL_COOKIE,
    value: code,
    maxAge: attrs.maxAge,
    httpOnly: attrs.httpOnly,
    sameSite: attrs.sameSite,
    secure: attrs.secure,
    path: attrs.path,
  });
  return res;
}
