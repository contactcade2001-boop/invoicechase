import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import {
  paymentPlanInstallments,
  paymentPlans,
  type PaymentPlanInstallmentRow,
  type PaymentPlanRow,
} from "./schema";

export type CreatePlanInput = {
  organizationId: number;
  customerId: string;
  customerName: string | null;
  totalCents: number;
  installmentCount: number;
  frequencyDays: number;
  note: string | null;
  installments: Array<{
    sequence: number;
    dueDate: string;
    amountCents: number;
    payLinkToken: string;
  }>;
};

export function createPaymentPlan(
  input: CreatePlanInput,
): PaymentPlanRow {
  const now = Date.now();
  const db = getDb();
  const plan = db
    .insert(paymentPlans)
    .values({
      organizationId: input.organizationId,
      customerId: input.customerId,
      customerName: input.customerName,
      totalCents: input.totalCents,
      installmentCount: input.installmentCount,
      frequencyDays: input.frequencyDays,
      status: "active",
      note: input.note,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  for (const inst of input.installments) {
    db.insert(paymentPlanInstallments)
      .values({
        planId: plan.id,
        sequence: inst.sequence,
        dueDate: inst.dueDate,
        amountCents: inst.amountCents,
        payLinkToken: inst.payLinkToken,
        status: "pending",
        createdAt: now,
      })
      .run();
  }
  return plan;
}

export function listPaymentPlansForOrg(
  organizationId: number,
): PaymentPlanRow[] {
  return getDb()
    .select()
    .from(paymentPlans)
    .where(eq(paymentPlans.organizationId, organizationId))
    .orderBy(desc(paymentPlans.createdAt))
    .all();
}

export function listInstallmentsForPlan(
  planId: number,
): PaymentPlanInstallmentRow[] {
  return getDb()
    .select()
    .from(paymentPlanInstallments)
    .where(eq(paymentPlanInstallments.planId, planId))
    .orderBy(asc(paymentPlanInstallments.sequence))
    .all();
}

export function getPaymentPlanByIdForOrg(
  planId: number,
  organizationId: number,
): PaymentPlanRow | null {
  return (
    getDb()
      .select()
      .from(paymentPlans)
      .where(
        and(
          eq(paymentPlans.id, planId),
          eq(paymentPlans.organizationId, organizationId),
        ),
      )
      .get() ?? null
  );
}

export function findInstallmentByPayLinkToken(
  token: string,
): PaymentPlanInstallmentRow | null {
  return (
    getDb()
      .select()
      .from(paymentPlanInstallments)
      .where(eq(paymentPlanInstallments.payLinkToken, token))
      .get() ?? null
  );
}

export function markInstallmentPaid(installmentId: number): void {
  const now = Date.now();
  getDb()
    .update(paymentPlanInstallments)
    .set({ status: "paid", paidAt: now })
    .where(eq(paymentPlanInstallments.id, installmentId))
    .run();
}
