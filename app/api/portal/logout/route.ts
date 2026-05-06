import { NextResponse, type NextRequest } from "next/server";
import { destroyCurrentPortalSession } from "@/lib/server/portal/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await destroyCurrentPortalSession();
  return NextResponse.redirect(new URL("/portal", req.url), { status: 303 });
}
