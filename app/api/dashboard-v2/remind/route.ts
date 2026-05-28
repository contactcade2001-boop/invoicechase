import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { sendTextToCustomer } from "@/app/actions/sms";

export const dynamic = "force-dynamic";

/**
 * Owner-triggered one-tap reminder from the dashboard. Wraps the
 * existing sendTextToCustomer server action so all the guardrails (opt-
 * out, A2P, rate limit) apply.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    customerId?: string;
  };
  if (!body.customerId) {
    return NextResponse.json({ error: "missing_customer_id" }, { status: 400 });
  }
  const result = await sendTextToCustomer(body.customerId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
