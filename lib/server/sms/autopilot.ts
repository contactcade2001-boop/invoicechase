import "server-only";
import {
  generateAutopilotReply,
  type AutopilotContext,
} from "../anthropic/autopilot";
import {
  appendMessage,
  getOrCreateConversation,
  recentMessages,
} from "../db/sms";
import { getOrCreatePayLink } from "../pay/links";
import { getDashboardData } from "../qbo/sync";
import { sendRawSms } from "../twilio/sms";
import type { Customer } from "@/lib/types";
import type {
  OrganizationRow,
  SmsConversationRow,
} from "../db/schema";

export async function recordInboundAndMaybeReply(input: {
  org: OrganizationRow;
  fromPhone: string;
  body: string;
  twilioSid: string | null;
}): Promise<{
  conversation: SmsConversationRow;
  replied: boolean;
  reason?: string;
}> {
  const data = await getDashboardData(input.org.id);
  let customer: Customer | null = null;
  if (data.connected) {
    customer =
      data.customers.find(
        (c) => c.phone && normalizePhone(c.phone) === normalizePhone(input.fromPhone),
      ) ?? null;
  }

  const conversation = getOrCreateConversation({
    organizationId: input.org.id,
    customerPhone: input.fromPhone,
    customerId: customer?.id ?? null,
    customerName: customer?.name ?? null,
  });

  appendMessage({
    conversationId: conversation.id,
    direction: "inbound",
    body: input.body,
    twilioSid: input.twilioSid,
  });

  if (input.org.autopilotEnabled !== 1) {
    return { conversation, replied: false, reason: "autopilot_disabled" };
  }

  const businessName = data.connected ? data.companyName : input.org.name;
  const payUrl =
    customer && customer.amountOwed > 0
      ? getOrCreatePayLink(input.org.id, customer.id).url
      : null;

  const ctx: AutopilotContext = {
    businessName,
    customerName: customer?.name ?? null,
    amountCentsOwed: customer?.amountOwed ?? 0,
    daysLate: customer?.daysLate ?? 0,
    payUrl,
    history: recentMessages(conversation.id, 10),
  };

  const result = await generateAutopilotReply(ctx);
  if (!result.ok) {
    return { conversation, replied: false, reason: result.error };
  }

  try {
    const sent = await sendRawSms({
      to: input.fromPhone,
      body: result.reply,
    });
    appendMessage({
      conversationId: conversation.id,
      direction: "outbound",
      body: result.reply,
      twilioSid: sent.sid,
      autopilot: true,
    });
    return { conversation, replied: true };
  } catch (err) {
    console.error("[autopilot] send failed", err);
    return { conversation, replied: false, reason: "send_failed" };
  }
}

function normalizePhone(p: string): string {
  // Loose normalization for matching: strip everything except digits, keep
  // the last 10 digits (US-centric — good enough for matching against the
  // free-form QBO PrimaryPhone string).
  const digits = p.replace(/\D+/g, "");
  return digits.slice(-10);
}
