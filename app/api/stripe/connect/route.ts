import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { createOnboardingLink } from "@/lib/server/stripe/connect";

export const dynamic = "force-dynamic";

async function startOnboarding(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }
  try {
    const url = await createOnboardingLink(user);
    return NextResponse.redirect(url, { status: 303 });
  } catch (err) {
    console.error("[stripe-connect] onboarding failed", err);
    return NextResponse.redirect(
      new URL("/billing?error=connect_failed", req.url),
      { status: 303 },
    );
  }
}

export async function GET(req: NextRequest) {
  return startOnboarding(req);
}

export async function POST(req: NextRequest) {
  return startOnboarding(req);
}
