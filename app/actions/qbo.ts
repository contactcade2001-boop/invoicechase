"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  finalizePayment,
  findPaymentById,
} from "@/lib/server/db/payments";
import { recordPaymentInQbo } from "@/lib/server/qbo/recordPayment";

export type RetrySyncResult =
  | { ok: true; qboPaymentId: string | null }
  | { ok: false; error: string };

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
    revalidatePath("/payments");
    return { ok: true, qboPaymentId: result.qboPaymentId };
  } catch (err) {
    console.error("[qbo] retry sync failed", err);
    return { ok: false, error: "qbo_failed" };
  }
}
