import "server-only";
import type { Customer } from "@/lib/types";
import { getTwilioConfig, useMockSms } from "../env";
import { renderSmsBody } from "@/lib/smsTemplate";
import { getTwilio } from "./client";

export type SmsContext = {
  template: string | null | undefined;
  businessName: string;
  payUrl: string;
};

export async function sendRawSms(input: {
  to: string;
  body: string;
}): Promise<{ sid: string | null }> {
  if (!input.to) throw new Error("Missing to number");
  if (useMockSms()) {
    console.log(
      `[sms:mock] to=${input.to} body=${JSON.stringify(input.body)}`,
    );
    return { sid: null };
  }
  const { fromNumber } = getTwilioConfig();
  const msg = await getTwilio().messages.create({
    from: fromNumber,
    to: input.to,
    body: input.body,
  });
  return { sid: msg.sid ?? null };
}

export async function sendInvoiceSms(
  customer: Customer,
  ctx: SmsContext,
): Promise<void> {
  if (!customer.phone) {
    throw new Error("Customer has no phone number on file");
  }
  const body = renderSmsBody(ctx.template, {
    amountCents: customer.amountOwed,
    payUrl: ctx.payUrl,
    customerName: customer.name,
    businessName: ctx.businessName,
  });
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
