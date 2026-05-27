import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { chargeAutopay } from "@/lib/server/stripe/autopay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || (user.role !== "owner" && user.role !== "manager")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    customerId?: string;
    amountDollars?: number;
    description?: string;
  };
  if (!body.customerId || typeof body.amountDollars !== "number") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const result = await chargeAutopay({
    organizationId: user.organizationId,
    customerId: body.customerId,
    amountCents: Math.round(body.amountDollars * 100),
    invoiceDescription: body.description ?? "Invoice payment",
  });
  return NextResponse.json(result);
}
