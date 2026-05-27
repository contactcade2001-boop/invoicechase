import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { createLien, resolveLien } from "@/lib/server/db/liens";
import { LIEN_DEADLINE_DAYS, computeLienDeadline } from "@/lib/server/liens/states";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || user.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    customerId?: string;
    customerName?: string;
    jobAddress?: string;
    state?: string;
    invoiceAmountDollars?: number;
    lastFurnishDateIso?: string;
    reminderDays?: number;
  };
  if (
    !body.customerId ||
    !body.state ||
    !body.lastFurnishDateIso ||
    typeof body.invoiceAmountDollars !== "number"
  ) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!(body.state.toUpperCase() in LIEN_DEADLINE_DAYS)) {
    return NextResponse.json({ error: "unsupported_state" }, { status: 400 });
  }
  const lastFurnish = new Date(body.lastFurnishDateIso).getTime();
  const deadline = computeLienDeadline(body.state, lastFurnish);
  if (!deadline) {
    return NextResponse.json({ error: "deadline_calc_failed" }, { status: 400 });
  }
  const lien = createLien({
    organizationId: user.organizationId,
    customerId: body.customerId,
    customerName: body.customerName ?? null,
    jobAddress: body.jobAddress ?? null,
    state: body.state,
    invoiceAmountCents: Math.round(body.invoiceAmountDollars * 100),
    lastFurnishDate: lastFurnish,
    filingDeadline: deadline,
    reminderDays: body.reminderDays ?? 30,
  });
  return NextResponse.json({ ok: true, lien });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || user.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    id?: number;
    status?: string;
  };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  resolveLien(user.organizationId, body.id, body.status);
  return NextResponse.json({ ok: true });
}
