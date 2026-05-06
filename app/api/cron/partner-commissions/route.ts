import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/server/cron/auth";
import { runPartnerCommissionRun } from "@/lib/server/cron/partnerCommissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  try {
    const summary = await runPartnerCommissionRun();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[cron] partner commissions threw", err);
    return NextResponse.json(
      { ok: false, error: "run_failed" },
      { status: 500 },
    );
  }
}
