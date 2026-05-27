import { redirectUrl } from "@/lib/server/urls";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import {
  deleteServiceTitanConnection,
  getServiceTitanConnection,
} from "@/lib/server/db/fsmConnections";
import { invalidateDashboardCache } from "@/lib/server/qbo/sync";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(redirectUrl(req, "/login"), { status: 303 });
  }
  if (user.role !== "owner") {
    return NextResponse.redirect(redirectUrl(req, "/dashboard"), {
      status: 303,
    });
  }
  const orgId = user.organizationId!;
  const conn = getServiceTitanConnection(orgId);
  if (conn) {
    deleteServiceTitanConnection(orgId);
    invalidateDashboardCache(orgId);
    logAuditEvent({
      organizationId: orgId,
      userId: user.id,
      actorEmail: user.email,
      kind: "fsm.disconnected",
      targetType: "servicetitan",
      targetId: conn.tenantId,
    });
  }
  return NextResponse.redirect(redirectUrl(req, "/settings"), { status: 303 });
}
