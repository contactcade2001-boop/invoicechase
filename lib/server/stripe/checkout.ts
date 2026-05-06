import "server-only";
import {
  getSubscriptionByUserId,
  upsertSubscription,
} from "../db/subscriptions";
import type { UserRow } from "../db/schema";
import { getAppBaseUrl, getStripeConfig } from "../env";
import { getStripe } from "./client";

async function getOrCreateStripeCustomer(user: UserRow): Promise<string> {
  const existing = getSubscriptionByUserId(user.id);
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: String(user.id) },
  });
  upsertSubscription({
    userId: user.id,
    stripeCustomerId: customer.id,
  });
  return customer.id;
}

export async function createCheckoutSessionUrl(
  user: UserRow,
): Promise<string> {
  const { priceId } = getStripeConfig();
  const baseUrl = getAppBaseUrl();
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(user);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/billing?checkout=success`,
    cancel_url: `${baseUrl}/billing?checkout=cancel`,
    client_reference_id: String(user.id),
    metadata: { userId: String(user.id) },
    subscription_data: {
      metadata: { userId: String(user.id) },
    },
    allow_promotion_codes: true,
  });
  if (!session.url) {
    throw new Error("Stripe Checkout did not return a URL");
  }
  return session.url;
}

export async function createPortalSessionUrl(
  user: UserRow,
): Promise<string> {
  const sub = getSubscriptionByUserId(user.id);
  if (!sub) throw new Error("No subscription found for user");
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${getAppBaseUrl()}/billing`,
  });
  return session.url;
}
