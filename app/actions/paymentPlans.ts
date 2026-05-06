"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth/session";
import { generateToken } from "@/lib/server/auth/tokens";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import { insertPayLink } from "@/lib/server/db/payLinks";
import { createPaymentPlan } from "@/lib/server/db/paymentPlans";
import { lookupCustomerForOrg } from "@/lib/server/qbo/sync";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";

export type CreatePlanResult =
  | { ok: true; planId: number }
  | { ok: false; error: string };

const MIN_INSTALLMENTS = 2;
const MAX_INSTALLMENTS = 24;
const MIN_FREQUENCY = 7;
const MAX_FREQUENCY = 90;
const PAY_LINK_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function addDaysIso(start: Date, daysToAdd: number): string {
  const d = new Date(start);
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

function splitEvenly(totalCents: number, parts: number): number[] {
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents - base * parts;
  return Array.from({ length: parts }, (_, i) =>
    i < remainder ? base + 1 : base,
  );
}

export async function createPaymentPlanForCustomer(input: {
  customerId: string;
  totalCents: number;
  installmentCount: number;
  frequencyDays: number;
  startDate: string; // YYYY-MM-DD
  note: string;
}): Promise<CreatePlanResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role === "technician") return { ok: false, error: "forbidden" };
  const orgId = user.organizationId;
  if (!orgId) return { ok: false, error: "no_organization" };
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    return { ok: false, error: "no_active_subscription" };
  }

  const total = Math.round(input.totalCents);
  if (!Number.isFinite(total) || total <= 0) {
    return { ok: false, error: "invalid_total" };
  }
  const count = Math.round(input.installmentCount);
  if (count < MIN_INSTALLMENTS || count > MAX_INSTALLMENTS) {
    return { ok: false, error: "invalid_count" };
  }
  const frequency = Math.round(input.frequencyDays);
  if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) {
    return { ok: false, error: "invalid_frequency" };
  }
  const startDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.startDate);
  if (!startDateMatch) return { ok: false, error: "invalid_start_date" };
  const startDate = new Date(`${input.startDate}T00:00:00Z`);
  if (Number.isNaN(startDate.getTime())) {
    return { ok: false, error: "invalid_start_date" };
  }

  const customer = await lookupCustomerForOrg(orgId, input.customerId);
  if (!customer.ok) {
    return {
      ok: false,
      error: customer.reason === "not_connected" ? "not_connected" : "customer_not_found",
    };
  }

  const amounts = splitEvenly(total, count);
  const expiresAt = Date.now() + PAY_LINK_TTL_MS;
  const installments = amounts.map((cents, i) => {
    const token = generateToken();
    insertPayLink({
      token,
      organizationId: orgId,
      customerId: input.customerId,
      expiresAt,
      amountCentsOverride: cents,
    });
    return {
      sequence: i + 1,
      dueDate: addDaysIso(startDate, i * frequency),
      amountCents: cents,
      payLinkToken: token,
    };
  });

  const plan = createPaymentPlan({
    organizationId: orgId,
    customerId: input.customerId,
    customerName: customer.customer.name,
    totalCents: total,
    installmentCount: count,
    frequencyDays: frequency,
    note: input.note.trim().slice(0, 500) || null,
    installments,
  });

  logAuditEvent({
    organizationId: orgId,
    userId: user.id,
    actorEmail: user.email,
    kind: "payment_plan.created",
    targetType: "payment_plan",
    targetId: String(plan.id),
    metadata: {
      customerId: input.customerId,
      totalCents: total,
      installmentCount: count,
      frequencyDays: frequency,
    },
  });

  revalidatePath("/payment-plans");
  revalidatePath(`/dashboard/customer/${input.customerId}`);
  return { ok: true, planId: plan.id };
}
