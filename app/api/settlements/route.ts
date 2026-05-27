import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  createSettlementOffer,
  markOfferStatus,
} from "@/lib/server/db/settlements";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || user.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    customerId?: string;
    customerName?: string;
    originalBalanceDollars?: number;
    discountPercent?: number;
    expiresInHours?: number;
  };
  if (
    !body.customerId ||
    typeof body.originalBalanceDollars !== "number" ||
    typeof body.discountPercent !== "number"
  ) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const offer = createSettlementOffer({
    organizationId: user.organizationId,
    customerId: body.customerId,
    customerName: body.customerName ?? null,
    originalBalanceCents: Math.round(body.originalBalanceDollars * 100),
    discountBps: Math.round(body.discountPercent * 100),
    expiresInHours: body.expiresInHours ?? 48,
  });
  return NextResponse.json({ ok: true, offer });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || user.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    id?: number;
    status?: "accepted" | "declined" | "paid";
  };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  markOfferStatus(user.organizationId, body.id, body.status);
  return NextResponse.json({ ok: true });
}
