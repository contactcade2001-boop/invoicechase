import "server-only";
import type Stripe from "stripe";
import {
  getConnectAccountByStripeId,
  upsertConnectAccount,
} from "../db/connect";
import { upsertPaymentBySession } from "../db/payments";
import {
  getSubscriptionByStripeCustomerId,
  upsertSubscription,
} from "../db/subscriptions";
import { getStripeConfig } from "../env";
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

function userIdFrom(meta: Stripe.Metadata | null | undefined): number | null {
  const raw = meta?.userId;
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
  const userId =
    userIdFrom(sub.metadata) ??
    getSubscriptionByStripeCustomerId(customerId)?.userId ??
    null;
  if (!userId) {
    console.warn("[stripe] no userId for subscription", sub.id);
    return;
  }
  upsertSubscription({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    status: sub.status,
    currentPeriodEnd: periodEndMs(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}

function applyConnectAccount(account: Stripe.Account): void {
  const userId =
    userIdFrom(account.metadata) ??
    getConnectAccountByStripeId(account.id)?.userId ??
    null;
  if (!userId) {
    console.warn("[stripe-connect] no userId for account", account.id);
    return;
  }
  upsertConnectAccount({
    userId,
    stripeAccountId: account.id,
    chargesEnabled: !!account.charges_enabled,
    payoutsEnabled: !!account.payouts_enabled,
    detailsSubmitted: !!account.details_submitted,
  });
}

function applyOneTimePayment(session: Stripe.Checkout.Session): void {
  const userId = userIdFrom(session.metadata);
  const customerId = session.metadata?.customerId ?? null;
  if (!userId || !customerId) {
    console.warn("[stripe] no user/customer for pay session", session.id);
    return;
  }
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);
  upsertPaymentBySession({
    userId,
    customerId,
    customerName: null,
    amountCents: session.amount_total ?? 0,
    applicationFeeCents: session.payment_intent &&
      typeof session.payment_intent !== "string"
      ? session.payment_intent.application_fee_amount ?? null
      : null,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    status: session.payment_status === "paid" ? "succeeded" : "pending",
    paidAt: session.payment_status === "paid" ? Date.now() : null,
  });
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
        applyOneTimePayment(session);
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
    default:
      return;
  }
}
