import { redirectUrl } from "@/lib/server/urls";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import {
  deleteJobberConnection,
  getJobberConnectionForOrg,
} from "@/lib/server/db/jobberConnections";
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
  const conn = getJobberConnectionForOrg(orgId);
  if (conn) {
    // Jobber's OAuth doesn't expose a public token-revocation endpoint, so we
    // just drop the connection locally. The refresh token will naturally
    // expire and the user can re-revoke from Jobber's account settings.
    deleteJobberConnection(orgId);
    invalidateDashboardCache(orgId);
    logAuditEvent({
      organizationId: orgId,
      userId: user.id,
      actorEmail: user.email,
      kind: "jobber.disconnected",
      targetType: "account",
      targetId: conn.accountId,
    });
  }
  return NextResponse.redirect(redirectUrl(req, "/settings"), { status: 303 });
}
