import { NextResponse, type NextRequest } from "next/server";
import { requestPortalMagicLink } from "@/lib/server/portal/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim();
  if (!email) {
    return NextResponse.redirect(
      new URL("/portal?error=missing_email", req.url),
      { status: 303 },
    );
  }
  try {
    await requestPortalMagicLink(email);
  } catch (err) {
    console.error("[portal] request failed", err);
    return NextResponse.redirect(
      new URL("/portal?error=invalid_email", req.url),
      { status: 303 },
    );
  }
  return NextResponse.redirect(
    new URL(
      `/portal?sent=1&email=${encodeURIComponent(email)}`,
      req.url,
    ),
    { status: 303 },
  );
}
