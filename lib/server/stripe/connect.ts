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

/*
 * WHO PAYS WHAT — sample $100 (10000¢) invoice, paid by card
 * ─────────────────────────────────────────────────────────────────────
 * We use DIRECT CHARGES: the charge is created on the contractor's
 * connected account (see payCheckout.ts / autopay.ts passing
 * `{ stripeAccount }`). With direct charges the connected account bears
 * Stripe's processing fee by default — we never touch it.
 *
 *   Customer pays ............................. $100.00
 *   Stripe processing fee (2.9% + 30¢) ....... -$3.20   ← from CONTRACTOR
 *   Our application fee (1.9%, floor) ........ -$1.90   ← to PLATFORM, clean
 *   ─────────────────────────────────────────────────
 *   Contractor nets .......................... $94.90
 *   Platform nets ............................ $1.90    ← pure margin
 *   Stripe gets .............................. $3.20    (out of contractor)
 *
 * The platform NEVER pays Stripe's processing fee. If this ever shows the
 * platform balance going negative on a charge, someone reintroduced a
 * destination charge (`transfer_data`) — that's the bug to look for.
 *
 * Account type: Express connected accounts. For direct charges this already
 * bills the connected account for Stripe fees. If you migrate account
 * creation to the newer `controller` API, set
 * `controller: { fees: { payer: "account" } }` to preserve this behavior.
 */

async function ensureStripeAccountId(user: UserRow): Promise<string> {
  const orgId = user.organizationId!;
  const existing = getConnectAccount(orgId);
  if (existing) return existing.stripeAccountId;
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      organizationId: String(orgId),
      ownerUserId: String(user.id),
    },
  });
  upsertConnectAccount({
    organizationId: orgId,
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
  organizationId: number,
  accountId: string,
): Promise<void> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  upsertConnectAccount({
    organizationId,
    stripeAccountId: account.id,
    chargesEnabled: !!account.charges_enabled,
    payoutsEnabled: !!account.payouts_enabled,
    detailsSubmitted: !!account.details_submitted,
  });
}

/**
 * Whether a refund should also hand our 1.9% application fee back to the
 * merchant. Configurable via REFUND_APPLICATION_FEE_ON_REFUND.
 *
 *   false (default) → platform KEEPS the 1.9%. Matches Stripe's own default
 *                     and the spirit of "we did the work of collecting it".
 *   true            → platform returns its fee proportional to the refund,
 *                     so a full refund leaves the platform with $0 on that
 *                     charge.
 */
export function shouldRefundApplicationFee(): boolean {
  return process.env.REFUND_APPLICATION_FEE_ON_REFUND === "true";
}

/**
 * Refund a charge that lives on a connected account (direct charge).
 *
 * Because the charge is on the connected account, the refund MUST be issued
 * with `{ stripeAccount }` — issuing it on the platform account would 404.
 *
 * `refund_application_fee` controls whether our 1.9% comes back too:
 *   - Stripe pulls the refunded application fee from the PLATFORM balance and
 *     returns it to the connected account, so the merchant isn't out our cut.
 *   - Stripe's processing fee is NOT returned by Stripe on refunds regardless
 *     (that's Stripe's policy, not ours) — the contractor eats it, same as the
 *     original charge.
 *
 * Pass `amountCents` for a partial refund; omit for a full refund.
 */
export async function refundCharge(input: {
  organizationId: number;
  paymentIntentId: string;
  amountCents?: number;
  refundApplicationFee?: boolean;
}): Promise<{ ok: true; refundId: string } | { ok: false; error: string }> {
  const account = getConnectAccount(input.organizationId);
  if (!account) return { ok: false, error: "no_connect_account" };

  const refundApplicationFee =
    input.refundApplicationFee ?? shouldRefundApplicationFee();

  try {
    const refund = await getStripe().refunds.create(
      {
        payment_intent: input.paymentIntentId,
        ...(input.amountCents != null ? { amount: input.amountCents } : {}),
        // Only meaningful when the charge carried an application fee.
        refund_application_fee: refundApplicationFee,
      },
      { stripeAccount: account.stripeAccountId },
    );
    return { ok: true, refundId: refund.id };
  } catch (err) {
    const stripeErr = err as { code?: string; raw?: { code?: string } };
    return {
      ok: false,
      error: stripeErr.code ?? stripeErr.raw?.code ?? "refund_failed",
    };
  }
}
