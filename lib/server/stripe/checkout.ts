import "server-only";
import {
  getSubscriptionByOrgId,
  upsertSubscription,
} from "../db/subscriptions";
import type { UserRow } from "../db/schema";
import { getAppBaseUrl, getStripeConfig } from "../env";
import { getStripe } from "./client";

async function getOrCreateStripeCustomer(user: UserRow): Promise<string> {
  const orgId = user.organizationId!;
  const existing = getSubscriptionByOrgId(orgId);
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: {
      organizationId: String(orgId),
      ownerUserId: String(user.id),
    },
  });
  upsertSubscription({
    organizationId: orgId,
    stripeCustomerId: customer.id,
  });
  return customer.id;
}

export async function createCheckoutSessionUrl(
  user: UserRow,
): Promise<string> {
  const orgId = user.organizationId!;
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
    client_reference_id: String(orgId),
    metadata: { organizationId: String(orgId) },
    subscription_data: {
      metadata: { organizationId: String(orgId) },
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
  const sub = getSubscriptionByOrgId(user.organizationId!);
  if (!sub) throw new Error("No subscription found for organization");
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${getAppBaseUrl()}/billing`,
  });
  return session.url;
}
