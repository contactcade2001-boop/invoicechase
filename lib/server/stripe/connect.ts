import "server-only";
import {
  getConnectAccount,
  upsertConnectAccount,
} from "../db/connect";
import type { UserRow } from "../db/schema";
import { getAppBaseUrl } from "../env";
import { getStripe } from "./client";

export const APPLICATION_FEE_BPS = 190; // 1.9% in basis points

export function applicationFeeCents(amountCents: number): number {
  return Math.floor((amountCents * APPLICATION_FEE_BPS) / 10000);
}

async function ensureStripeAccountId(user: UserRow): Promise<string> {
  const existing = getConnectAccount(user.id);
  if (existing) return existing.stripeAccountId;
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { userId: String(user.id) },
  });
  upsertConnectAccount({
    userId: user.id,
    stripeAccountId: account.id,
    chargesEnabled: !!account.charges_enabled,
    payoutsEnabled: !!account.payouts_enabled,
    detailsSubmitted: !!account.details_submitted,
  });
  return account.id;
}

export async function createOnboardingLink(user: UserRow): Promise<string> {
  const accountId = await ensureStripeAccountId(user);
  const stripe = getStripe();
  const baseUrl = getAppBaseUrl();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/api/stripe/connect`,
    return_url: `${baseUrl}/billing?connect=return`,
    type: "account_onboarding",
  });
  return link.url;
}

export async function refreshConnectStatus(
  userId: number,
  accountId: string,
): Promise<void> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  upsertConnectAccount({
    userId,
    stripeAccountId: account.id,
    chargesEnabled: !!account.charges_enabled,
    payoutsEnabled: !!account.payouts_enabled,
    detailsSubmitted: !!account.details_submitted,
  });
}
