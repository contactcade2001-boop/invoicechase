import { NextResponse, type NextRequest } from "next/server";
import { requestMagicLink } from "@/lib/server/auth/magic-link";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim();
  if (!email) {
    return NextResponse.redirect(
      new URL("/login?error=missing_email", req.url),
      { status: 303 },
    );
  }
  try {
    await requestMagicLink(email);
  } catch (err) {
    console.error("[auth] request failed", err);
    return NextResponse.redirect(
      new URL("/login?error=invalid_email", req.url),
      { status: 303 },
    );
  }
  return NextResponse.redirect(
    new URL(`/login?sent=1&email=${encodeURIComponent(email)}`, req.url),
    { status: 303 },
  );
}
