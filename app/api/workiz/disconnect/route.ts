import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import {
  deleteWorkizConnection,
  getWorkizConnection,
} from "@/lib/server/db/fsmConnections";
import { invalidateDashboardCache } from "@/lib/server/qbo/sync";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }
  if (user.role !== "owner") {
    return NextResponse.redirect(new URL("/dashboard", req.url), {
      status: 303,
    });
  }
  const orgId = user.organizationId!;
  if (getWorkizConnection(orgId)) {
    deleteWorkizConnection(orgId);
    invalidateDashboardCache(orgId);
    logAuditEvent({
      organizationId: orgId,
      userId: user.id,
      actorEmail: user.email,
      kind: "fsm.disconnected",
      targetType: "workiz",
      targetId: String(orgId),
    });
  }
  return NextResponse.redirect(new URL("/settings", req.url), { status: 303 });
}
