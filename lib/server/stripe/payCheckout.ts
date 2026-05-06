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

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
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
      transfer_data: {
        destination: account!.stripeAccountId,
      },
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
  });

  if (!session.url) {
    return { ok: false, error: "no_session_url" };
  }
  return { ok: true, url: session.url };
}
