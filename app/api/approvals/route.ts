import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { approve, decline, markSent } from "@/lib/server/db/approvalQueue";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || user.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    id?: number;
    action?: "approve" | "decline" | "sent";
  };
  if (!body.id || !body.action) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (body.action === "approve") approve(user.organizationId, body.id, user.id);
  else if (body.action === "decline") decline(user.organizationId, body.id);
  else markSent(user.organizationId, body.id);
  return NextResponse.json({ ok: true });
}
