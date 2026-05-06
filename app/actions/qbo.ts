"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth/session";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import {
  finalizePayment,
  findPaymentById,
} from "@/lib/server/db/payments";
import { recordPaymentInQbo } from "@/lib/server/qbo/recordPayment";
import { LIMITS, checkRateLimit } from "@/lib/server/rateLimit";
import { getDashboardData } from "@/lib/server/qbo/sync";

export type RetrySyncResult =
  | { ok: true; qboPaymentId: string | null }
  | { ok: false; error: string };

export type RefreshResult =
  | { ok: true; refreshedAt: number }
  | { ok: false; error: string };

export async function refreshDashboard(): Promise<RefreshResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  const orgId = user.organizationId;
  if (!orgId) return { ok: false, error: "no_organization" };
  // Re-use the per-org SMS-per-minute bucket as a cheap manual-refresh
  // throttle so a stuck button can't hammer QBO.
  const limit = checkRateLimit(
    `dash:refresh:${orgId}`,
    LIMITS.smsPerMinute.max,
    LIMITS.smsPerMinute.windowMs,
  );
  if (!limit.allowed) return { ok: false, error: "rate_limited" };
  try {
    const data = await getDashboardData(orgId, { forceRefresh: true });
    if (!data.connected) return { ok: false, error: "not_connected" };
    revalidatePath("/dashboard");
    return { ok: true, refreshedAt: data.refreshedAt ?? Date.now() };
  } catch (err) {
    console.error("[qbo] dashboard refresh failed", err);
    return { ok: false, error: "refresh_failed" };
  }
}

export async function retryQboSync(
  paymentId: number,
): Promise<RetrySyncResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role === "technician") {
    return { ok: false, error: "forbidden" };
  }
  const orgId = user.organizationId;
  if (!orgId) return { ok: false, error: "no_organization" };

  const payment = findPaymentById(paymentId, orgId);
  if (!payment) return { ok: false, error: "not_found" };
  if (payment.status !== "succeeded") {
    return { ok: false, error: "not_succeeded" };
  }
  if (payment.qboPaymentId) {
    return { ok: true, qboPaymentId: payment.qboPaymentId };
  }
  if (!payment.stripeCheckoutSessionId) {
    return { ok: false, error: "no_session" };
  }

  try {
    const result = await recordPaymentInQbo({
      organizationId: orgId,
      customerId: payment.customerId,
      amountCents: payment.amountCents,
      noteRef: payment.stripeCheckoutSessionId,
    });
    finalizePayment(payment.stripeCheckoutSessionId, result);
    if (result.qboPaymentId) {
      logAuditEvent({
        organizationId: orgId,
        userId: user.id,
        actorEmail: user.email,
        kind: "qbo.payment_retry_synced",
        targetType: "payment",
        targetId: String(payment.id),
        metadata: { qboPaymentId: result.qboPaymentId },
      });
    }
    revalidatePath("/payments");
    return { ok: true, qboPaymentId: result.qboPaymentId };
  } catch (err) {
    console.error("[qbo] retry sync failed", err);
    return { ok: false, error: "qbo_failed" };
  }
}
