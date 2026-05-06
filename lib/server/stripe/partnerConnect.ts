import "server-only";
import { setPartnerStripeAccount } from "../db/partners";
import { findPartnerById } from "../db/partners";
import { getAppBaseUrl } from "../env";
import { getStripe } from "./client";
import type { PartnerRow } from "../db/schema";

async function ensurePartnerStripeAccount(
  partner: PartnerRow,
): Promise<string> {
  if (partner.stripeAccountId) return partner.stripeAccountId;
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email: partner.payoutEmail ?? partner.email,
    capabilities: {
      transfers: { requested: true },
    },
    metadata: {
      partnerId: String(partner.id),
      role: "partner_payouts",
    },
  });
  setPartnerStripeAccount(partner.id, account.id);
  return account.id;
}

export async function createPartnerOnboardingLink(
  partnerId: number,
): Promise<string> {
  const partner = findPartnerById(partnerId);
  if (!partner) throw new Error("Partner not found");
  const accountId = await ensurePartnerStripeAccount(partner);
  const stripe = getStripe();
  const base = getAppBaseUrl();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${base}/partner?stripe=refresh`,
    return_url: `${base}/partner?stripe=return`,
    type: "account_onboarding",
  });
  return link.url;
}

export async function transferCommissionCents(input: {
  stripeAccountId: string;
  amountCents: number;
  metadata: Record<string, string>;
}): Promise<{ id: string }> {
  const stripe = getStripe();
  const transfer = await stripe.transfers.create({
    amount: input.amountCents,
    currency: "usd",
    destination: input.stripeAccountId,
    metadata: input.metadata,
  });
  return { id: transfer.id };
}
