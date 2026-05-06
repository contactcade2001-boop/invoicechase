import "server-only";
import type { Customer } from "@/lib/types";
import { getOrgById } from "../db/organizations";
import { getTwilioConfig, useMockSms } from "../env";
import { renderSmsBody } from "@/lib/smsTemplate";
import { isOptedOut } from "../sms/optOut";
import { getTwilio } from "./client";

export class OptedOutError extends Error {
  constructor(public readonly phone: string) {
    super(`Recipient ${phone} has opted out of SMS`);
    this.name = "OptedOutError";
  }
}

export type SmsContext = {
  template: string | null | undefined;
  businessName: string;
  payUrl: string;
  organizationId?: number;
};

function fromNumberFor(organizationId?: number): string {
  if (organizationId) {
    const org = getOrgById(organizationId);
    if (org?.twilioPhoneNumber && org.twilioPhoneNumber.trim().length > 0) {
      return org.twilioPhoneNumber.trim();
    }
  }
  return getTwilioConfig().fromNumber;
}

function assertNotOptedOut(
  organizationId: number | undefined,
  phone: string,
  bypass: boolean,
): void {
  if (bypass) return;
  if (!organizationId) return;
  if (isOptedOut(organizationId, phone)) {
    throw new OptedOutError(phone);
  }
}

export async function sendRawSms(input: {
  to: string;
  body: string;
  organizationId?: number;
  // Set true ONLY for STOP/HELP/START acknowledgements — those bypass the
  // opt-out check because they're carrier-mandated.
  bypassOptOut?: boolean;
}): Promise<{ sid: string | null }> {
  if (!input.to) throw new Error("Missing to number");
  assertNotOptedOut(input.organizationId, input.to, !!input.bypassOptOut);
  if (useMockSms()) {
    console.log(
      `[sms:mock] org=${input.organizationId ?? "platform"} to=${input.to} body=${JSON.stringify(input.body)}`,
    );
    return { sid: null };
  }
  const from = fromNumberFor(input.organizationId);
  const msg = await getTwilio().messages.create({
    from,
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
  assertNotOptedOut(ctx.organizationId, customer.phone, false);
  const body = renderSmsBody(ctx.template, {
    amountCents: customer.amountOwed,
    payUrl: ctx.payUrl,
    customerName: customer.name,
    businessName: ctx.businessName,
  });
  if (useMockSms()) {
    console.log(
      `[sms:mock] org=${ctx.organizationId ?? "platform"} to=${customer.phone} body=${JSON.stringify(body)}`,
    );
    return;
  }
  const from = fromNumberFor(ctx.organizationId);
  await getTwilio().messages.create({
    from,
    to: customer.phone,
    body,
  });
}
