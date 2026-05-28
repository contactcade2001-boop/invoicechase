import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/server/cron/auth";
import { runWeeklyReport } from "@/lib/server/cron/weeklyReport";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  try {
    const summary = await runWeeklyReport();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[cron] weekly report threw", err);
    return NextResponse.json(
      { ok: false, error: "run_failed" },
      { status: 500 },
    );
  }
}
