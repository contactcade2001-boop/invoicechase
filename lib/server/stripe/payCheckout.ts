import "server-only";
import { canAcceptPayments, getConnectAccount } from "../db/connect";
import { getOrgById } from "../db/organizations";
import type { Customer } from "@/lib/types";
import { getAppBaseUrl } from "../env";
import { getStripe } from "./client";
import { applicationFeeCents } from "./connect";

export type StartPayResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createPayCheckoutUrl(input: {
  organizationId: number;
  token: string;
  customer: Customer;
  companyName: string;
  amountCentsOverride?: number | null;
}): Promise<StartPayResult> {
  const account = getConnectAccount(input.organizationId);
  if (!canAcceptPayments(account)) {
    return { ok: false, error: "merchant_not_ready" };
  }

  const amount = input.amountCentsOverride ?? input.customer.amountOwed;
  if (amount <= 0) {
    return { ok: false, error: "nothing_owed" };
  }

  const baseUrl = getAppBaseUrl();
  const successUrl = `${baseUrl}/pay/${input.token}?paid=1`;
  const cancelUrl = `${baseUrl}/pay/${input.token}`;
  const fee = applicationFeeCents(amount);
  const productName = input.amountCentsOverride
    ? `Deposit for ${input.companyName}`
    : `Invoice from ${input.companyName}`;

  // Offer cards, ACH, and BNPL (Klarna for $50–$10k, Afterpay for $35–$2k).
  // Stripe gracefully ignores methods not enabled on the connected account,
  // so listing them is safe and unlocks adoption when the merchant enables
  // each from their Stripe dashboard.
  const paymentMethodTypes: ("card" | "us_bank_account" | "klarna" | "afterpay_clearpay")[] = [
    "card",
    "us_bank_account",
  ];
  // Klarna minimum is $50, Afterpay minimum is $35 (both USD).
  if (amount >= 5000) paymentMethodTypes.push("klarna");
  if (amount >= 3500 && amount <= 200_000) paymentMethodTypes.push("afterpay_clearpay");

  // DIRECT CHARGE: the `{ stripeAccount }` request option (last arg) creates
  // the Checkout Session — and therefore the PaymentIntent and charge — ON the
  // contractor's connected account. That is what makes Stripe's processing fee
  // (~2.9% + 30¢) come out of the CONTRACTOR's balance, not ours. We collect
  // our cut as `application_fee_amount`, which transfers to the platform clean.
  //
  // Do NOT add `transfer_data`/`destination` here — that turns this back into a
  // DESTINATION charge, where the charge lives on the platform account and
  // Stripe deducts its fee from OUR balance. (See the $100 walkthrough at the
  // top of connect.ts.)
  const session = await getStripe().checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: paymentMethodTypes,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: productName,
              description: input.customer.name,
            },
          },
        },
      ],
      customer_email: input.customer.email,
      payment_intent_data: {
        application_fee_amount: fee,
        // When the org opts into custom receipts, suppress Stripe's auto-receipt
        // so we don't send two. Otherwise let Stripe handle it.
        receipt_email:
          getOrgById(input.organizationId)?.customReceiptsEnabled === 1
            ? undefined
            : input.customer.email,
        metadata: {
          organizationId: String(input.organizationId),
          customerId: input.customer.id,
          payLinkToken: input.token,
        },
      },
      metadata: {
        organizationId: String(input.organizationId),
        customerId: input.customer.id,
        payLinkToken: input.token,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    },
    { stripeAccount: account!.stripeAccountId },
  );

  if (!session.url) {
    return { ok: false, error: "no_session_url" };
  }
  return { ok: true, url: session.url };
}
