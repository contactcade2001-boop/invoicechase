import { redirectUrl } from "@/lib/server/urls";
import { NextResponse, type NextRequest } from "next/server";
import { destroyCurrentPortalSession } from "@/lib/server/portal/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await destroyCurrentPortalSession();
  return NextResponse.redirect(redirectUrl(req, "/portal"), { status: 303 });
}
