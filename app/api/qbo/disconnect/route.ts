import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { decryptToken } from "@/lib/server/crypto";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import {
  deleteConnectionForOrg,
  getConnectionForOrg,
} from "@/lib/server/db/connections";
import { revokeToken } from "@/lib/server/qbo/oauth";
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
  const conn = getConnectionForOrg(orgId);
  if (conn) {
    try {
      await revokeToken(decryptToken(conn.refreshTokenEnc));
    } catch (err) {
      console.error("[qbo] revoke failed (deleting locally anyway)", err);
    }
    deleteConnectionForOrg(orgId, conn.realmId);
    invalidateDashboardCache(orgId);
    logAuditEvent({
      organizationId: orgId,
      userId: user.id,
      actorEmail: user.email,
      kind: "qbo.disconnected",
      targetType: "realm",
      targetId: conn.realmId,
    });
  }
  return NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
}
