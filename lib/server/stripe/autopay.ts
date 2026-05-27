import "server-only";
import { canAcceptPayments, getConnectAccount } from "../db/connect";
import {
  getAutopayMethod,
  saveAutopayMethod,
} from "../db/autopay";
import { applicationFeeCents } from "./connect";
import { getStripe } from "./client";

/**
 * Create a SetupIntent so the customer can save a payment method on the
 * org's Stripe Connect account. The frontend uses the returned client_secret
 * with Stripe Elements to collect card details off-session.
 */
export async function createAutopaySetupIntent(input: {
  organizationId: number;
  customerId: string;
  customerEmail: string;
  customerName?: string | null;
}): Promise<
  | { ok: true; clientSecret: string; stripeAccountId: string; publishableKey: string }
  | { ok: false; error: string }
> {
  const account = getConnectAccount(input.organizationId);
  if (!canAcceptPayments(account)) {
    return { ok: false, error: "merchant_not_ready" };
  }
  const pk = process.env.STRIPE_PUBLISHABLE_KEY?.trim();
  if (!pk) return { ok: false, error: "missing_publishable_key" };

  const stripe = getStripe();
  const existing = getAutopayMethod(input.organizationId, input.customerId);

  // Reuse the Stripe Customer if one exists, otherwise create on the
  // connected account.
  let stripeCustomerId = existing?.stripeCustomerId ?? null;
  if (!stripeCustomerId) {
    const created = await stripe.customers.create(
      {
        email: input.customerEmail.toLowerCase(),
        name: input.customerName ?? undefined,
        metadata: {
          ic_customer_id: input.customerId,
          ic_organization_id: String(input.organizationId),
        },
      },
      { stripeAccount: account!.stripeAccountId },
    );
    stripeCustomerId = created.id;
  }

  const setup = await stripe.setupIntents.create(
    {
      customer: stripeCustomerId,
      payment_method_types: ["card", "us_bank_account"],
      usage: "off_session",
      metadata: {
        ic_customer_id: input.customerId,
        ic_organization_id: String(input.organizationId),
      },
    },
    { stripeAccount: account!.stripeAccountId },
  );

  return {
    ok: true,
    clientSecret: setup.client_secret!,
    stripeAccountId: account!.stripeAccountId,
    publishableKey: pk,
  };
}

/**
 * Called after the frontend successfully confirms the SetupIntent. We pull
 * the resulting PaymentMethod, store the id + display info, and consider the
 * customer enrolled in autopay.
 */
export async function completeAutopayEnrollment(input: {
  organizationId: number;
  customerId: string;
  customerEmail: string;
  setupIntentId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const account = getConnectAccount(input.organizationId);
  if (!canAcceptPayments(account)) {
    return { ok: false, error: "merchant_not_ready" };
  }
  const stripe = getStripe();
  const intent = await stripe.setupIntents.retrieve(
    input.setupIntentId,
    {},
    { stripeAccount: account!.stripeAccountId },
  );
  if (intent.status !== "succeeded") {
    return { ok: false, error: "intent_not_succeeded" };
  }
  const pmId =
    typeof intent.payment_method === "string"
      ? intent.payment_method
      : intent.payment_method?.id;
  const stripeCustomerId =
    typeof intent.customer === "string"
      ? intent.customer
      : (intent.customer?.id ?? "");
  if (!pmId || !stripeCustomerId) {
    return { ok: false, error: "missing_method" };
  }

  // Pull display info for the saved method.
  const pm = await stripe.paymentMethods.retrieve(
    pmId,
    {},
    { stripeAccount: account!.stripeAccountId },
  );
  const brand = pm.card?.brand ?? pm.us_bank_account?.bank_name ?? null;
  const last4 = pm.card?.last4 ?? pm.us_bank_account?.last4 ?? null;

  saveAutopayMethod({
    organizationId: input.organizationId,
    customerId: input.customerId,
    customerEmail: input.customerEmail,
    stripeCustomerId,
    stripePaymentMethodId: pmId,
    brand,
    last4,
  });
  return { ok: true };
}

/**
 * Charge the saved payment method for the amount owed. Off-session — sends
 * an "authentication required" failure if the card needs SCA confirmation
 * (rare in the US, common in EU).
 */
export async function chargeAutopay(input: {
  organizationId: number;
  customerId: string;
  amountCents: number;
  invoiceDescription: string;
}): Promise<
  | { ok: true; paymentIntentId: string }
  | { ok: false; error: string; requiresAuthentication?: boolean }
> {
  if (input.amountCents <= 0) return { ok: false, error: "zero_amount" };
  const account = getConnectAccount(input.organizationId);
  if (!canAcceptPayments(account)) {
    return { ok: false, error: "merchant_not_ready" };
  }
  const method = getAutopayMethod(input.organizationId, input.customerId);
  if (!method) return { ok: false, error: "not_enrolled" };
  if (method.paused === 1) return { ok: false, error: "paused" };

  const stripe = getStripe();
  const fee = applicationFeeCents(input.amountCents);
  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: input.amountCents,
        currency: "usd",
        customer: method.stripeCustomerId,
        payment_method: method.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        application_fee_amount: fee,
        description: input.invoiceDescription,
        metadata: {
          ic_customer_id: input.customerId,
          ic_organization_id: String(input.organizationId),
          source: "autopay",
        },
      },
      { stripeAccount: account!.stripeAccountId },
    );
    return { ok: true, paymentIntentId: intent.id };
  } catch (err) {
    const stripeErr = err as {
      code?: string;
      raw?: { code?: string };
      message?: string;
    };
    const code = stripeErr.code ?? stripeErr.raw?.code ?? "unknown";
    return {
      ok: false,
      error: code,
      requiresAuthentication: code === "authentication_required",
    };
  }
}
