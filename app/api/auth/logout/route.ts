import { NextResponse, type NextRequest } from "next/server";
import { destroyCurrentSession } from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await destroyCurrentSession();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
