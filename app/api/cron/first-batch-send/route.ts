import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/server/cron/auth";
import { listAllConnections } from "@/lib/server/db/connections";
import { getBatchForOrg } from "@/lib/server/db/onboardingBatches";
import { sendNextFirstWinBatch } from "@/lib/server/onboarding/firstWinBatch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PER_RUN_PER_ORG = 5;

/**
 * Cron that walks every org with an approved-but-not-complete first-win
 * batch and sends up to N items each, respecting business hours +
 * compliance. GH Actions runs this every 15 minutes; throttling falls
 * out for free (max 5 sends per org per 15 min ≈ 20/hr — well under
 * carrier spam-filter thresholds).
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const orgIds = new Set<number>();
  for (const c of listAllConnections()) orgIds.add(c.organizationId);

  const perOrg: Record<number, unknown> = {};
  for (const orgId of orgIds) {
    const batch = getBatchForOrg(orgId);
    if (!batch) continue;
    if (batch.status !== "approved" && batch.status !== "sending") continue;
    try {
      perOrg[orgId] = await sendNextFirstWinBatch(orgId, MAX_PER_RUN_PER_ORG);
    } catch (err) {
      console.error("[cron] first-batch-send threw for org", orgId, err);
      perOrg[orgId] = { error: "run_failed" };
    }
  }
  return NextResponse.json({ ok: true, perOrg });
}
