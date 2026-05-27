import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { completeAutopayEnrollment } from "@/lib/server/stripe/autopay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || (user.role !== "owner" && user.role !== "manager")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    customerId?: string;
    customerEmail?: string;
    setupIntentId?: string;
  };
  if (!body.customerId || !body.customerEmail || !body.setupIntentId) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const result = await completeAutopayEnrollment({
    organizationId: user.organizationId,
    customerId: body.customerId,
    customerEmail: body.customerEmail,
    setupIntentId: body.setupIntentId,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
