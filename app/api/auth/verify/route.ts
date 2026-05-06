import { NextResponse, type NextRequest } from "next/server";
import { verifyMagicLink } from "@/lib/server/auth/magic-link";
import { createSession } from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  try {
    const { userId } = await verifyMagicLink(token);
    await createSession(userId);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (err) {
    console.error("[auth] verify failed", err);
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "expired_link");
    return NextResponse.redirect(url);
  }
}
