import { redirectUrl } from "@/lib/server/urls";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { decryptToken } from "@/lib/server/crypto";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import {
  deleteXeroConnection,
  getXeroConnectionForOrg,
} from "@/lib/server/db/xeroConnections";
import { invalidateDashboardCache } from "@/lib/server/qbo/sync";
import { revokeToken } from "@/lib/server/xero/oauth";

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
  const conn = getXeroConnectionForOrg(orgId);
  if (conn) {
    try {
      await revokeToken(decryptToken(conn.refreshTokenEnc));
    } catch (err) {
      console.error("[xero] revoke failed (deleting locally anyway)", err);
    }
    deleteXeroConnection(orgId);
    invalidateDashboardCache(orgId);
    logAuditEvent({
      organizationId: orgId,
      userId: user.id,
      actorEmail: user.email,
      kind: "xero.disconnected",
      targetType: "tenant",
      targetId: conn.tenantId,
    });
  }
  return NextResponse.redirect(redirectUrl(req, "/settings"), { status: 303 });
}
