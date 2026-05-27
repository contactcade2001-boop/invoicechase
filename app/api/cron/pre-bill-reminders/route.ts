import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedCron } from "@/lib/server/cron/auth";
import {
  listAppointmentsDueForReminder,
  markReminderSent,
} from "@/lib/server/db/appointments";
import { getOrgById } from "@/lib/server/db/organizations";
import { sendRawSms } from "@/lib/server/twilio/sms";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const appts = listAppointmentsDueForReminder();
  let sent = 0;
  let skipped = 0;
  const now = Date.now();
  for (const a of appts) {
    const daysUntil = Math.ceil((a.scheduledFor - now) / 86_400_000);
    if (daysUntil > a.reminderDaysBefore) continue;
    if (!a.customerPhone) {
      skipped++;
      continue;
    }
    const org = getOrgById(a.organizationId);
    if (!org) {
      skipped++;
      continue;
    }
    const date = new Date(a.scheduledFor).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const body = `Hi ${a.customerName?.split(" ")[0] ?? "there"} — friendly reminder from ${org.name}: your appointment is ${date}${a.description ? ` (${a.description})` : ""}. Reply if you need to reschedule.`;
    try {
      await sendRawSms({
        to: a.customerPhone,
        body,
        organizationId: a.organizationId,
      });
      markReminderSent(a.id);
      sent++;
    } catch (err) {
      console.error("[pre-bill] sms failed", err);
    }
  }
  return NextResponse.json({ ok: true, sent, skipped, considered: appts.length });
}
