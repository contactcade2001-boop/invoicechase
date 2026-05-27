import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { createAutopaySetupIntent } from "@/lib/server/stripe/autopay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || (user.role !== "owner" && user.role !== "manager")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    customerId?: string;
    customerEmail?: string;
    customerName?: string;
  };
  if (!body.customerId || !body.customerEmail) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const result = await createAutopaySetupIntent({
    organizationId: user.organizationId,
    customerId: body.customerId,
    customerEmail: body.customerEmail,
    customerName: body.customerName ?? null,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    clientSecret: result.clientSecret,
    stripeAccountId: result.stripeAccountId,
    publishableKey: result.publishableKey,
  });
}
