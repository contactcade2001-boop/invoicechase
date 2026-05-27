import { redirectUrl } from "@/lib/server/urls";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { createCheckoutSessionUrl } from "@/lib/server/stripe/checkout";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(redirectUrl(req, "/login"), { status: 303 });
  }
  if (user.role !== "owner") {
    return NextResponse.redirect(redirectUrl(req, "/dashboard"), {
      status: 303,
    });
  }
  try {
    const url = await createCheckoutSessionUrl(user);
    return NextResponse.redirect(url, { status: 303 });
  } catch (err) {
    console.error("[stripe] checkout failed", err);
    return NextResponse.redirect(
      redirectUrl(req, "/billing?error=checkout_failed"),
      { status: 303 },
    );
  }
}
