import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = false;
  let dbError: string | null = null;
  try {
    const db = getDb();
    // Trivial query that goes through the connection.
    db.$client.prepare("SELECT 1").get();
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const body = {
    ok: dbOk,
    db: dbOk ? "ok" : "error",
    dbError,
    timestamp: new Date().toISOString(),
    runtime: process.env.NEXT_RUNTIME ?? "unknown",
    sentry: !!process.env.SENTRY_DSN,
  };
  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
