import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { updateCashflowConfig } from "@/lib/server/db/cashflow";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || user.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  updateCashflowConfig(user.organizationId, {
    earlyPayDiscountBps:
      typeof body.earlyPayDiscountBps === "number"
        ? body.earlyPayDiscountBps
        : undefined,
    earlyPayDays:
      typeof body.earlyPayDays === "number" ? body.earlyPayDays : undefined,
    achDiscountBps:
      typeof body.achDiscountBps === "number" ? body.achDiscountBps : undefined,
    lateFeeBps:
      typeof body.lateFeeBps === "number" ? body.lateFeeBps : undefined,
    lateFeeStartDays:
      typeof body.lateFeeStartDays === "number"
        ? body.lateFeeStartDays
        : undefined,
    preDueReminderDays:
      typeof body.preDueReminderDays === "number"
        ? body.preDueReminderDays
        : undefined,
    smartSendTimesEnabled:
      typeof body.smartSendTimesEnabled === "boolean"
        ? body.smartSendTimesEnabled
        : undefined,
    bankBalanceCents:
      typeof body.bankBalanceDollars === "number"
        ? Math.round(body.bankBalanceDollars * 100)
        : undefined,
  });
  return NextResponse.json({ ok: true });
}
