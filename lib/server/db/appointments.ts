import "server-only";
import { and, eq, gte, isNull, lt } from "drizzle-orm";
import { getDb } from "./client";
import { scheduledAppointments } from "./schema";

export type Appointment = {
  id: number;
  organizationId: number;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  scheduledFor: number;
  description: string | null;
  reminderDaysBefore: number;
  reminderSentAt: number | null;
  status: string;
  createdAt: number;
};

export function listUpcomingAppointments(
  orgId: number,
  customerId?: string,
): Appointment[] {
  const db = getDb();
  const base = customerId
    ? and(
        eq(scheduledAppointments.organizationId, orgId),
        eq(scheduledAppointments.customerId, customerId),
        gte(scheduledAppointments.scheduledFor, Date.now()),
      )
    : and(
        eq(scheduledAppointments.organizationId, orgId),
        gte(scheduledAppointments.scheduledFor, Date.now()),
      );
  return db
    .select()
    .from(scheduledAppointments)
    .where(base)
    .all() as unknown as Appointment[];
}

export function listAppointmentsDueForReminder(): Appointment[] {
  const db = getDb();
  const now = Date.now();
  const horizon = now + 7 * 86_400_000;
  // Return any appointment within reminder_days_before, not yet sent.
  return db
    .select()
    .from(scheduledAppointments)
    .where(
      and(
        isNull(scheduledAppointments.reminderSentAt),
        gte(scheduledAppointments.scheduledFor, now),
        lt(scheduledAppointments.scheduledFor, horizon),
      ),
    )
    .all() as unknown as Appointment[];
}

export function createAppointment(input: {
  organizationId: number;
  customerId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  scheduledFor: number;
  description?: string | null;
  reminderDaysBefore?: number;
}): Appointment {
  const db = getDb();
  const row = db
    .insert(scheduledAppointments)
    .values({
      organizationId: input.organizationId,
      customerId: input.customerId,
      customerName: input.customerName ?? null,
      customerPhone: input.customerPhone ?? null,
      scheduledFor: input.scheduledFor,
      description: input.description ?? null,
      reminderDaysBefore: input.reminderDaysBefore ?? 3,
      createdAt: Date.now(),
    })
    .returning()
    .get();
  return row as unknown as Appointment;
}

export function markReminderSent(id: number): void {
  const db = getDb();
  db.update(scheduledAppointments)
    .set({ reminderSentAt: Date.now() })
    .where(eq(scheduledAppointments.id, id))
    .run();
}

export function cancelAppointment(orgId: number, id: number): void {
  const db = getDb();
  db.update(scheduledAppointments)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(scheduledAppointments.organizationId, orgId),
        eq(scheduledAppointments.id, id),
      ),
    )
    .run();
}
