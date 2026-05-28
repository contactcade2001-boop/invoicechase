import "server-only";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./client";
import { paidInvoices, reminderSends } from "./schema";

export type PaidInvoiceRow = {
  id: number;
  organizationId: number;
  customerId: string;
  sourceInvoiceId: string;
  installmentNumber: number;
  source: string;
  issuedAt: number;
  paidAt: number;
  daysToPayment: number;
  amountCents: number;
  attributedReminderId: number | null;
  attributedAiReplyAt: number | null;
  createdAt: number;
};

export type PaidInvoiceInput = {
  organizationId: number;
  customerId: string;
  sourceInvoiceId: string;
  installmentNumber?: number;
  source: "qbo" | "xero" | "jobber" | "stripe" | "housecallpro" | "servicetitan";
  issuedAt: number;
  paidAt: number;
  amountCents: number;
};

/**
 * Look back N days from paidAt for any reminder we sent to this customer.
 * If one exists, attach its id so we can later report attributed dollars.
 * Returns the reminder id, or null when nothing matched.
 */
function findAttributedReminder(
  organizationId: number,
  customerId: string,
  paidAt: number,
  windowDays = 14,
): number | null {
  const db = getDb();
  const since = paidAt - windowDays * 86_400_000;
  const row = db
    .select({ id: reminderSends.id })
    .from(reminderSends)
    .where(
      and(
        eq(reminderSends.organizationId, organizationId),
        eq(reminderSends.customerId, customerId),
        gte(reminderSends.sentAt, since),
        lte(reminderSends.sentAt, paidAt),
      ),
    )
    .orderBy(sql`${reminderSends.sentAt} DESC`)
    .get();
  return row?.id ?? null;
}

/**
 * Record a paid invoice (or paid installment). Idempotent — `(org, source,
 * sourceInvoiceId, installmentNumber)` is uniquely indexed. Computes
 * daysToPayment + attaches the most recent preceding reminder, if any.
 */
export function recordPaidInvoice(
  input: PaidInvoiceInput,
): { ok: true; id: number; inserted: boolean } | { ok: false; reason: string } {
  if (input.paidAt < input.issuedAt) {
    return { ok: false, reason: "paid_before_issued" };
  }
  if (input.amountCents <= 0) {
    return { ok: false, reason: "non_positive_amount" };
  }
  const db = getDb();
  const installment = input.installmentNumber ?? 1;
  const daysToPayment = Math.round(
    (input.paidAt - input.issuedAt) / 86_400_000,
  );
  const attributedReminderId = findAttributedReminder(
    input.organizationId,
    input.customerId,
    input.paidAt,
  );
  const now = Date.now();
  try {
    const row = db
      .insert(paidInvoices)
      .values({
        organizationId: input.organizationId,
        customerId: input.customerId,
        sourceInvoiceId: input.sourceInvoiceId,
        installmentNumber: installment,
        source: input.source,
        issuedAt: input.issuedAt,
        paidAt: input.paidAt,
        daysToPayment,
        amountCents: input.amountCents,
        attributedReminderId,
        attributedAiReplyAt: null,
        createdAt: now,
      })
      .returning({ id: paidInvoices.id })
      .get();
    return { ok: true, id: row.id, inserted: true };
  } catch (err) {
    // Unique-constraint violation = already recorded. Look up and return.
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) {
      const existing = db
        .select({ id: paidInvoices.id })
        .from(paidInvoices)
        .where(
          and(
            eq(paidInvoices.organizationId, input.organizationId),
            eq(paidInvoices.source, input.source),
            eq(paidInvoices.sourceInvoiceId, input.sourceInvoiceId),
            eq(paidInvoices.installmentNumber, installment),
          ),
        )
        .get();
      if (existing) {
        return { ok: true, id: existing.id, inserted: false };
      }
    }
    return { ok: false, reason: msg };
  }
}

export function listPaidInvoicesInRange(
  organizationId: number,
  fromTs: number,
  toTs: number,
): PaidInvoiceRow[] {
  const db = getDb();
  return db
    .select()
    .from(paidInvoices)
    .where(
      and(
        eq(paidInvoices.organizationId, organizationId),
        gte(paidInvoices.paidAt, fromTs),
        lte(paidInvoices.paidAt, toTs),
      ),
    )
    .all() as unknown as PaidInvoiceRow[];
}
