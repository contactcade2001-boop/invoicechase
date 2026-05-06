import "server-only";
import { canAcceptPayments, getConnectAccount } from "../db/connect";
import type { Customer } from "@/lib/types";
import { getAppBaseUrl } from "../env";
import { getStripe } from "./client";
import { applicationFeeCents } from "./connect";

export type StartPayResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createPayCheckoutUrl(input: {
  userId: number;
  token: string;
  customer: Customer;
  companyName: string;
}): Promise<StartPayResult> {
  const account = getConnectAccount(input.userId);
  if (!canAcceptPayments(account)) {
    return { ok: false, error: "merchant_not_ready" };
  }
  if (input.customer.amountOwed <= 0) {
    return { ok: false, error: "nothing_owed" };
  }

  const baseUrl = getAppBaseUrl();
  const successUrl = `${baseUrl}/pay/${input.token}?paid=1`;
  const cancelUrl = `${baseUrl}/pay/${input.token}`;
  const fee = applicationFeeCents(input.customer.amountOwed);

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: input.customer.amountOwed,
          product_data: {
            name: `Invoice from ${input.companyName}`,
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
      receipt_email: input.customer.email,
      metadata: {
        userId: String(input.userId),
        customerId: input.customer.id,
        payLinkToken: input.token,
      },
    },
    metadata: {
      userId: String(input.userId),
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
