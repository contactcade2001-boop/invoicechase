import { NextResponse, type NextRequest } from "next/server";
import { upsertCustomerMetadata } from "@/lib/server/db/customerMetadata";
import { getCurrentUser } from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    customerId?: string;
    note?: string | null;
    snoozeDays?: number | null;
    tags?: string[];
    tone?: "gentle" | "neutral" | "firm" | null;
  };
  if (!body.customerId) {
    return NextResponse.json({ error: "missing_customer_id" }, { status: 400 });
  }
  const snoozedUntil =
    body.snoozeDays === null
      ? null
      : typeof body.snoozeDays === "number" && body.snoozeDays > 0
        ? Date.now() + body.snoozeDays * 86_400_000
        : undefined;
  const result = upsertCustomerMetadata({
    organizationId: user.organizationId,
    customerId: body.customerId,
    note: body.note,
    snoozedUntil,
    tags: body.tags,
    tone: body.tone,
  });
  return NextResponse.json({ ok: true, metadata: result });
}
