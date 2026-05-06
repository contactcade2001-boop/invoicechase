import "server-only";
import { formatCurrencyDetailed } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { getTwilioConfig, useMockSms } from "../env";
import { getTwilio } from "./client";

function buildBody(customer: Customer, payUrl: string): string {
  return `Pay ${formatCurrencyDetailed(customer.amountOwed)} now: ${payUrl}`;
}

export async function sendInvoiceSms(
  customer: Customer,
  payUrl: string,
): Promise<void> {
  if (!customer.phone) {
    throw new Error("Customer has no phone number on file");
  }
  const body = buildBody(customer, payUrl);
  if (useMockSms()) {
    console.log(
      `[sms:mock] to=${customer.phone} body=${JSON.stringify(body)}`,
    );
    return;
  }
  const { fromNumber } = getTwilioConfig();
  await getTwilio().messages.create({
    from: fromNumber,
    to: customer.phone,
    body,
  });
}
