import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  cancelAppointment,
  createAppointment,
} from "@/lib/server/db/appointments";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    scheduledForIso?: string;
    description?: string;
    reminderDaysBefore?: number;
  };
  if (!body.customerId || !body.scheduledForIso) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const ts = new Date(body.scheduledForIso).getTime();
  if (!Number.isFinite(ts)) {
    return NextResponse.json({ error: "bad_date" }, { status: 400 });
  }
  const appt = createAppointment({
    organizationId: user.organizationId,
    customerId: body.customerId,
    customerName: body.customerName ?? null,
    customerPhone: body.customerPhone ?? null,
    scheduledFor: ts,
    description: body.description ?? null,
    reminderDaysBefore: body.reminderDaysBefore ?? 3,
  });
  return NextResponse.json({ ok: true, appointment: appt });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { id?: number };
  if (!body.id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }
  cancelAppointment(user.organizationId, body.id);
  return NextResponse.json({ ok: true });
}
