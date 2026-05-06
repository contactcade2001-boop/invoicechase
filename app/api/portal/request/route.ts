import { NextResponse, type NextRequest } from "next/server";
import { findOrgByPortalSlug } from "@/lib/server/db/organizations";
import { requestPortalMagicLink } from "@/lib/server/portal/auth";

export const dynamic = "force-dynamic";

function basePath(slug: string | null): string {
  if (!slug) return "/portal";
  // Defense-in-depth: drop anything that's not a slug-shaped string.
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!safe || !findOrgByPortalSlug(safe)) return "/portal";
  return `/p/${safe}`;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim();
  const slug = form.get("slug");
  const base = basePath(typeof slug === "string" ? slug : null);

  if (!email) {
    return NextResponse.redirect(
      new URL(`${base}?error=missing_email`, req.url),
      { status: 303 },
    );
  }
  try {
    await requestPortalMagicLink(email);
  } catch (err) {
    console.error("[portal] request failed", err);
    return NextResponse.redirect(
      new URL(`${base}?error=invalid_email`, req.url),
      { status: 303 },
    );
  }
  return NextResponse.redirect(
    new URL(
      `${base}?sent=1&email=${encodeURIComponent(email)}`,
      req.url,
    ),
    { status: 303 },
  );
}
