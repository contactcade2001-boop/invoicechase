import { redirectUrl } from "@/lib/server/urls";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import {
  deleteFieldPulseConnection,
  getFieldPulseConnection,
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
  if (getFieldPulseConnection(orgId)) {
    deleteFieldPulseConnection(orgId);
    invalidateDashboardCache(orgId);
    logAuditEvent({
      organizationId: orgId,
      userId: user.id,
      actorEmail: user.email,
      kind: "fsm.disconnected",
      targetType: "fieldpulse",
      targetId: String(orgId),
    });
  }
  return NextResponse.redirect(redirectUrl(req, "/settings"), { status: 303 });
}
