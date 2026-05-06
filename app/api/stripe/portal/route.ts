import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { createPortalSessionUrl } from "@/lib/server/stripe/checkout";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }
  if (user.role !== "owner") {
    return NextResponse.redirect(new URL("/dashboard", req.url), {
      status: 303,
    });
  }
  try {
    const url = await createPortalSessionUrl(user);
    return NextResponse.redirect(url, { status: 303 });
  } catch (err) {
    console.error("[stripe] portal failed", err);
    return NextResponse.redirect(
      new URL("/billing?error=portal_failed", req.url),
      { status: 303 },
    );
  }
}
