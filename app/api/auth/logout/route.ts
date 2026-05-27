import { NextResponse, type NextRequest } from "next/server";
import { destroyCurrentSession } from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await destroyCurrentSession();
  const base = (process.env.APP_BASE_URL ?? req.url).replace(/\/$/, "");
  return NextResponse.redirect(new URL("/", base), { status: 303 });
}
