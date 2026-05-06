import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { payments, type PaymentRow } from "./schema";

export type PaymentUpsert = {
  organizationId: number;
  customerId: string;
  customerName: string | null;
  customerEmail?: string | null;
  amountCents: number;
  applicationFeeCents: number | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  status: "pending" | "succeeded" | "failed";
  paidAt: number | null;
};

export function upsertPaymentBySession(input: PaymentUpsert): void {
  if (!input.stripeCheckoutSessionId) {
    throw new Error("upsertPaymentBySession requires checkout session id");
  }
  const db = getDb();
  const now = Date.now();
  db.insert(payments)
    .values({
      ...input,
      customerEmail: input.customerEmail ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: payments.stripeCheckoutSessionId,
      set: {
        amountCents: input.amountCents,
        applicationFeeCents: input.applicationFeeCents,
        stripePaymentIntentId: input.stripePaymentIntentId,
        customerEmail: input.customerEmail ?? null,
        status: input.status,
        paidAt: input.paidAt,
        updatedAt: now,
      },
    })
    .run();
}

export function markReceiptSent(sessionId: string): void {
  const db = getDb();
  db.update(payments)
    .set({ receiptSentAt: Date.now(), updatedAt: Date.now() })
    .where(eq(payments.stripeCheckoutSessionId, sessionId))
    .run();
}

export function findPaymentBySession(
  sessionId: string,
): PaymentRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(payments)
    .where(eq(payments.stripeCheckoutSessionId, sessionId))
    .get();
  return row ?? null;
}

export function setPaymentQboId(
  sessionId: string,
  qboPaymentId: string,
): void {
  const db = getDb();
  db.update(payments)
    .set({ qboPaymentId, updatedAt: Date.now() })
    .where(eq(payments.stripeCheckoutSessionId, sessionId))
    .run();
}

export function finalizePayment(
  sessionId: string,
  fields: {
    qboPaymentId?: string | null;
    customerName?: string | null;
  },
): void {
  const db = getDb();
  const set: Record<string, unknown> = { updatedAt: Date.now() };
  if (fields.qboPaymentId) set.qboPaymentId = fields.qboPaymentId;
  if (fields.customerName) set.customerName = fields.customerName;
  if (Object.keys(set).length === 1) return;
  db.update(payments)
    .set(set)
    .where(eq(payments.stripeCheckoutSessionId, sessionId))
    .run();
}

export function findPaymentById(
  id: number,
  organizationId: number,
): PaymentRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(payments)
    .where(and(eq(payments.id, id), eq(payments.organizationId, organizationId)))
    .get();
  return row ?? null;
}

export type PaymentStatus =
  | "pending"
  | "succeeded"
  | "partially_refunded"
  | "refunded"
  | "disputed"
  | "failed";

export function setPaymentStatus(
  paymentIntentId: string,
  status: PaymentStatus,
): void {
  const db = getDb();
  db.update(payments)
    .set({ status, updatedAt: Date.now() })
    .where(eq(payments.stripePaymentIntentId, paymentIntentId))
    .run();
}

export function setRefundedAmount(
  paymentIntentId: string,
  refundedAmountCents: number,
  status: PaymentStatus,
): void {
  const db = getDb();
  db.update(payments)
    .set({
      refundedAmountCents,
      status,
      updatedAt: Date.now(),
    })
    .where(eq(payments.stripePaymentIntentId, paymentIntentId))
    .run();
}

export function findPaymentByIntent(
  paymentIntentId: string,
): PaymentRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, paymentIntentId))
    .get();
  return row ?? null;
}

export function clearPaymentQboId(paymentIntentId: string): void {
  const db = getDb();
  db.update(payments)
    .set({ qboPaymentId: null, updatedAt: Date.now() })
    .where(eq(payments.stripePaymentIntentId, paymentIntentId))
    .run();
}

export function listPaymentsForOrg(
  organizationId: number,
  limit = 100,
): PaymentRow[] {
  const db = getDb();
  return db
    .select()
    .from(payments)
    .where(eq(payments.organizationId, organizationId))
    .orderBy(desc(payments.createdAt))
    .limit(limit)
    .all();
}

export type PaymentSummary = {
  lifetimeCents: number;
  lifetimeFeesCents: number;
  thisMonthCents: number;
  count: number;
};

function startOfMonthMs(): number {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

export function summarizePaymentsForOrg(
  organizationId: number,
): PaymentSummary {
  const db = getDb();
  const monthStart = startOfMonthMs();
  const lifetime = db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organizationId),
        eq(payments.status, "succeeded"),
      ),
    )
    .all();
  const thisMonth = lifetime.filter(
    (p) => (p.paidAt ?? p.createdAt) >= monthStart,
  );
  return {
    lifetimeCents: lifetime.reduce((s, p) => s + p.amountCents, 0),
    lifetimeFeesCents: lifetime.reduce(
      (s, p) => s + (p.applicationFeeCents ?? 0),
      0,
    ),
    thisMonthCents: thisMonth.reduce((s, p) => s + p.amountCents, 0),
    count: lifetime.length,
  };
}
