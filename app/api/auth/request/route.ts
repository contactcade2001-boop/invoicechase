import { redirectUrl } from "@/lib/server/urls";
import { NextResponse, type NextRequest } from "next/server";
import { requestMagicLink } from "@/lib/server/auth/magic-link";
import { LIMITS, checkRateLimit } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.redirect(
      redirectUrl(req, "/login?error=missing_email"),
      { status: 303 },
    );
  }
  // Silent rate limit: we still show the "check your email" page so the
  // response doesn't leak which addresses are throttled (or exist).
  const limit = checkRateLimit(
    `magic-link:${email}`,
    LIMITS.magicLinkPerHour.max,
    LIMITS.magicLinkPerHour.windowMs,
  );
  if (limit.allowed) {
    try {
      await requestMagicLink(email);
    } catch (err) {
      console.error("[auth] request failed", err);
      const message =
        err instanceof Error && /Invalid email/.test(err.message)
          ? "invalid_email"
          : null;
      if (message) {
        return NextResponse.redirect(
          new URL(`/login?error=${message}`, req.url),
          { status: 303 },
        );
      }
    }
  } else {
    console.warn("[auth] magic-link rate limit hit for", email);
  }
  return NextResponse.redirect(
    new URL(`/login?sent=1&email=${encodeURIComponent(email)}`, req.url),
    { status: 303 },
  );
}
