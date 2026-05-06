import "server-only";
import type Stripe from "stripe";
import {
  getConnectAccountByStripeId,
  upsertConnectAccount,
} from "../db/connect";
import {
  clearPaymentQboId,
  finalizePayment,
  findPaymentByIntent,
  findPaymentBySession,
  setPaymentStatus,
  setRefundedAmount,
  upsertPaymentBySession,
} from "../db/payments";
import {
  getSubscriptionByStripeCustomerId,
  upsertSubscription,
} from "../db/subscriptions";
import { getStripeConfig } from "../env";
import { recordPaymentInQbo } from "../qbo/recordPayment";
import { voidQboPayment } from "../qbo/voidPayment";
import { getStripe } from "./client";

export async function constructEvent(
  rawBody: string,
  signature: string,
): Promise<Stripe.Event> {
  const { webhookSecret } = getStripeConfig();
  return getStripe().webhooks.constructEventAsync(
    rawBody,
    signature,
    webhookSecret,
  );
}

function intMeta(
  meta: Stripe.Metadata | null | undefined,
  key: string,
): number | null {
  const raw = meta?.[key];
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function periodEndMs(sub: Stripe.Subscription): number | null {
  const item = sub.items?.data?.[0];
  const seconds = item?.current_period_end ?? null;
  return seconds ? seconds * 1000 : null;
}

async function applySubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const organizationId =
    intMeta(sub.metadata, "organizationId") ??
    getSubscriptionByStripeCustomerId(customerId)?.organizationId ??
    null;
  if (!organizationId) {
    console.warn("[stripe] no organizationId for subscription", sub.id);
    return;
  }
  upsertSubscription({
    organizationId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    status: sub.status,
    currentPeriodEnd: periodEndMs(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}

function applyConnectAccount(account: Stripe.Account): void {
  const organizationId =
    intMeta(account.metadata, "organizationId") ??
    getConnectAccountByStripeId(account.id)?.organizationId ??
    null;
  if (!organizationId) {
    console.warn("[stripe-connect] no organizationId for account", account.id);
    return;
  }
  upsertConnectAccount({
    organizationId,
    stripeAccountId: account.id,
    chargesEnabled: !!account.charges_enabled,
    payoutsEnabled: !!account.payouts_enabled,
    detailsSubmitted: !!account.details_submitted,
  });
}

async function applyOneTimePayment(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const organizationId = intMeta(session.metadata, "organizationId");
  const customerId = session.metadata?.customerId ?? null;
  if (!organizationId || !customerId) {
    console.warn(
      "[stripe] no organizationId/customerId for pay session",
      session.id,
    );
    return;
  }
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);
  const succeeded = session.payment_status === "paid";
  const amountCents = session.amount_total ?? 0;
  upsertPaymentBySession({
    organizationId,
    customerId,
    customerName: null,
    amountCents,
    applicationFeeCents:
      session.payment_intent && typeof session.payment_intent !== "string"
        ? (session.payment_intent.application_fee_amount ?? null)
        : null,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    status: succeeded ? "succeeded" : "pending",
    paidAt: succeeded ? Date.now() : null,
  });

  if (!succeeded) return;

  const existing = findPaymentBySession(session.id);
  if (existing?.qboPaymentId) return;
  try {
    const result = await recordPaymentInQbo({
      organizationId,
      customerId,
      amountCents,
      noteRef: session.id,
    });
    finalizePayment(session.id, result);
  } catch (err) {
    console.error("[qbo] mark-paid failed for session", session.id, err);
  }
}

export async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription") {
        if (!session.subscription) return;
        const stripe = getStripe();
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await applySubscription(sub);
        return;
      }
      if (session.mode === "payment") {
        await applyOneTimePayment(session);
        return;
      }
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await applySubscription(sub);
      return;
    }
    case "account.updated": {
      const account = event.data.object;
      applyConnectAccount(account);
      return;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const paymentIntentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : (charge.payment_intent?.id ?? null);
      if (!paymentIntentId) return;

      const fullyRefunded = charge.refunded === true;
      const refundedCents = charge.amount_refunded ?? 0;
      const newStatus = fullyRefunded ? "refunded" : "partially_refunded";
      setRefundedAmount(paymentIntentId, refundedCents, newStatus);

      // Only auto-void in QBO on a full refund. Partial refunds need
      // merchant-configurable accounts (deposit-to, refund category) so we
      // surface the partial state in /payments and let the owner reconcile
      // manually.
      if (!fullyRefunded) return;

      const payment = findPaymentByIntent(paymentIntentId);
      if (payment?.qboPaymentId && payment.organizationId) {
        try {
          await voidQboPayment(
            payment.organizationId,
            payment.qboPaymentId,
          );
          // Once voided, drop the QBO ID so the manual "retry sync" UI
          // doesn't try to undo the void.
          clearPaymentQboId(paymentIntentId);
        } catch (err) {
          console.error(
            "[qbo] void failed for payment",
            payment.qboPaymentId,
            err,
          );
        }
      }
      return;
    }
    case "charge.dispute.created": {
      const dispute = event.data.object;
      const paymentIntentId =
        typeof dispute.payment_intent === "string"
          ? dispute.payment_intent
          : (dispute.payment_intent?.id ?? null);
      if (paymentIntentId) {
        setPaymentStatus(paymentIntentId, "disputed");
      }
      return;
    }
    default:
      return;
  }
}
