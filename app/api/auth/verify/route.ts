import { NextResponse, type NextRequest } from "next/server";
import { verifyMagicLink } from "@/lib/server/auth/magic-link";
import { createSession } from "@/lib/server/auth/session";
import { attributeNewSignup } from "@/lib/server/partners/attribute";
import { REFERRAL_COOKIE } from "@/lib/server/partners/cookie";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  try {
    const { userId } = await verifyMagicLink(token);
    await createSession(userId);
    const referralCode = req.cookies.get(REFERRAL_COOKIE)?.value ?? null;
    const orgReferralCode = req.cookies.get("ic_org_ref")?.value ?? null;
    attributeNewSignup({ userId, referralCode, orgReferralCode });
    const res = NextResponse.redirect(new URL("/dashboard", req.url));
    if (referralCode) res.cookies.delete(REFERRAL_COOKIE);
    if (orgReferralCode) res.cookies.delete("ic_org_ref");
    return res;
  } catch (err) {
    console.error("[auth] verify failed", err);
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "expired_link");
    return NextResponse.redirect(url);
  }
}
