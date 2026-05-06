import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import {
  buildReconciliationCsv,
  monthBounds,
} from "@/lib/server/reports/reconciliation";

export const dynamic = "force-dynamic";

function parseMonthParam(raw: string | null): { year: number; month: number } | null {
  if (!raw) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  if (year < 2000 || year > 3000 || month < 0 || month > 11) return null;
  return { year, month };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  if (user.role === "technician") {
    return new NextResponse("forbidden", { status: 403 });
  }
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    return new NextResponse("subscription_required", { status: 402 });
  }

  const param = req.nextUrl.searchParams.get("month");
  const parsed = parseMonthParam(param);
  // Default to the previous full calendar month so cron-style downloads
  // can omit the param.
  const now = new Date();
  const year = parsed?.year ?? now.getUTCFullYear();
  const monthZero =
    parsed?.month ??
    (now.getUTCMonth() === 0 ? 11 : now.getUTCMonth() - 1);

  const { startMs, endMs } = monthBounds(year, monthZero);
  const csv = buildReconciliationCsv({
    organizationId: orgId,
    startMs,
    endMs,
  });
  const label = `${year}-${String(monthZero + 1).padStart(2, "0")}`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reconciliation-${label}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
