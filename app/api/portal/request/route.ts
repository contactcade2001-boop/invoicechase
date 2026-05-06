import { NextResponse, type NextRequest } from "next/server";
import { findOrgByPortalSlug } from "@/lib/server/db/organizations";
import { requestPortalMagicLink } from "@/lib/server/portal/auth";
import { LIMITS, checkRateLimit } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";

function basePath(slug: string | null): string {
  if (!slug) return "/portal";
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!safe || !findOrgByPortalSlug(safe)) return "/portal";
  return `/p/${safe}`;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const slug = form.get("slug");
  const base = basePath(typeof slug === "string" ? slug : null);

  if (!email) {
    return NextResponse.redirect(
      new URL(`${base}?error=missing_email`, req.url),
      { status: 303 },
    );
  }

  // Silent rate limit per email — shares the same bucket as merchant magic
  // links so an attacker can't get more attempts by switching surfaces.
  const limit = checkRateLimit(
    `magic-link:${email}`,
    LIMITS.magicLinkPerHour.max,
    LIMITS.magicLinkPerHour.windowMs,
  );
  if (limit.allowed) {
    try {
      await requestPortalMagicLink(email);
    } catch (err) {
      console.error("[portal] request failed", err);
      const message =
        err instanceof Error && /Invalid email/.test(err.message)
          ? "invalid_email"
          : null;
      if (message) {
        return NextResponse.redirect(
          new URL(`${base}?error=${message}`, req.url),
          { status: 303 },
        );
      }
    }
  } else {
    console.warn("[portal] magic-link rate limit hit for", email);
  }
  return NextResponse.redirect(
    new URL(
      `${base}?sent=1&email=${encodeURIComponent(email)}`,
      req.url,
    ),
    { status: 303 },
  );
}
