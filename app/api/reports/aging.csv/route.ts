import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { buildAgingCsv } from "@/lib/server/reports/aging";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  if (user.role === "technician") {
    return new NextResponse("forbidden", { status: 403 });
  }
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    return new NextResponse("subscription_required", { status: 402 });
  }
  const csv = await buildAgingCsv(orgId);
  if (!csv) {
    return new NextResponse("not_connected", { status: 409 });
  }
  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ar-aging-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
