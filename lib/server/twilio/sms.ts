import "server-only";
import { formatCurrencyDetailed } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { getAppBaseUrl, getTwilioConfig, useMockSms } from "../env";
import { getTwilio } from "./client";

function buildBody(customer: Customer): string {
  const amount = formatCurrencyDetailed(customer.amountOwed);
  const link = `${getAppBaseUrl()}/pay/${customer.id}`;
  return `Pay ${amount} now: ${link}`;
}

export async function sendInvoiceSms(customer: Customer): Promise<void> {
  if (!customer.phone) {
    throw new Error("Customer has no phone number on file");
  }
  const body = buildBody(customer);
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
