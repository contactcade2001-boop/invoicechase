import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForProfile } from "@/lib/server/auth/google";
import { createSession } from "@/lib/server/auth/session";
import { findOrCreateUser, markEmailVerified } from "@/lib/server/db/users";
import { attributeNewSignup } from "@/lib/server/partners/attribute";
import { REFERRAL_COOKIE } from "@/lib/server/partners/cookie";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "ic_google_state";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateParam = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get(STATE_COOKIE)?.value;
  const error = req.nextUrl.searchParams.get("error");

  function bail(reason: string) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", reason);
    const res = NextResponse.redirect(url);
    res.cookies.delete(STATE_COOKIE);
    return res;
  }

  if (error) return bail("google_denied");
  if (!code) return bail("google_missing_code");
  if (!stateParam || !stateCookie || stateParam !== stateCookie) {
    return bail("google_bad_state");
  }

  try {
    const profile = await exchangeCodeForProfile(code);
    if (!profile.emailVerified) return bail("google_unverified_email");

    const user = findOrCreateUser(profile.email);
    markEmailVerified(user.id);
    await createSession(user.id);

    const referralCode = req.cookies.get(REFERRAL_COOKIE)?.value ?? null;
    const orgReferralCode = req.cookies.get("ic_org_ref")?.value ?? null;
    attributeNewSignup({
      userId: user.id,
      referralCode,
      orgReferralCode,
    });

    const res = NextResponse.redirect(new URL("/dashboard", req.url));
    res.cookies.delete(STATE_COOKIE);
    if (referralCode) res.cookies.delete(REFERRAL_COOKIE);
    if (orgReferralCode) res.cookies.delete("ic_org_ref");
    return res;
  } catch (err) {
    console.error("[auth] google callback failed", err);
    return bail("google_failed");
  }
}
