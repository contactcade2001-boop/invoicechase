import "server-only";
import { cookies } from "next/headers";

export const REFERRAL_COOKIE = "ic_ref";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export async function readReferralCookie(): Promise<string | null> {
  const c = await cookies();
  const v = c.get(REFERRAL_COOKIE)?.value;
  return v && v.length > 0 ? v : null;
}

export async function clearReferralCookie(): Promise<void> {
  const c = await cookies();
  c.delete(REFERRAL_COOKIE);
}

export function referralCookieAttrs() {
  return {
    name: REFERRAL_COOKIE,
    maxAge: MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}
