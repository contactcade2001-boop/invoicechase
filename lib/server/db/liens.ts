import "server-only";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { getDb } from "./client";
import { mechanicsLiens } from "./schema";

export type Lien = {
  id: number;
  organizationId: number;
  customerId: string;
  customerName: string | null;
  jobAddress: string | null;
  state: string;
  invoiceAmountCents: number;
  lastFurnishDate: number;
  filingDeadline: number;
  reminderDays: number;
  status: string;
  resolvedAt: number | null;
  notes: string | null;
  createdAt: number;
};

export function listOpenLiens(orgId: number): Lien[] {
  const db = getDb();
  return db
    .select()
    .from(mechanicsLiens)
    .where(
      and(
        eq(mechanicsLiens.organizationId, orgId),
        isNull(mechanicsLiens.resolvedAt),
      ),
    )
    .all() as unknown as Lien[];
}

export function createLien(input: {
  organizationId: number;
  customerId: string;
  customerName?: string | null;
  jobAddress?: string | null;
  state: string;
  invoiceAmountCents: number;
  lastFurnishDate: number;
  filingDeadline: number;
  reminderDays?: number;
}): Lien {
  const db = getDb();
  const now = Date.now();
  const row = db
    .insert(mechanicsLiens)
    .values({
      organizationId: input.organizationId,
      customerId: input.customerId,
      customerName: input.customerName ?? null,
      jobAddress: input.jobAddress ?? null,
      state: input.state.toUpperCase(),
      invoiceAmountCents: input.invoiceAmountCents,
      lastFurnishDate: input.lastFurnishDate,
      filingDeadline: input.filingDeadline,
      reminderDays: input.reminderDays ?? 30,
      createdAt: now,
    })
    .returning()
    .get();
  return row as unknown as Lien;
}

export function resolveLien(orgId: number, id: number, status: string): void {
  const db = getDb();
  db.update(mechanicsLiens)
    .set({ status, resolvedAt: Date.now() })
    .where(
      and(
        eq(mechanicsLiens.organizationId, orgId),
        eq(mechanicsLiens.id, id),
      ),
    )
    .run();
}
