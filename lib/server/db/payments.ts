import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { payments, type PaymentRow } from "./schema";

export type PaymentUpsert = {
  userId: number;
  customerId: string;
  customerName: string | null;
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
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: payments.stripeCheckoutSessionId,
      set: {
        amountCents: input.amountCents,
        applicationFeeCents: input.applicationFeeCents,
        stripePaymentIntentId: input.stripePaymentIntentId,
        status: input.status,
        paidAt: input.paidAt,
        updatedAt: now,
      },
    })
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
