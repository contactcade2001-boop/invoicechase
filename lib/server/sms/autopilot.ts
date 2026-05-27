import "server-only";
import {
  generateAutopilotReply,
  type AutopilotContext,
} from "../anthropic/autopilot";
import {
  appendMessage,
  countMessagesInConversation,
  getOrCreateConversation,
  recentMessages,
  setConversationAutopilotPaused,
} from "../db/sms";
import { getCustomerMetadata } from "../db/customerMetadata";
import { findUserById } from "../db/users";
import { getOrCreatePayLink } from "../pay/links";
import { getDashboardData } from "../qbo/sync";
import { sendRawSms } from "../twilio/sms";
import { captureException } from "../observability";
import { classifyKeyword, clearOptOut, recordOptOut } from "./optOut";
import type { Customer } from "@/lib/types";
import type {
  OrganizationRow,
  SmsConversationRow,
} from "../db/schema";

const HISTORY_DEPTH = 30;

function helpReplyFor(orgName: string): string {
  return `${orgName}: text STOP to opt out. Msg & data rates may apply. Questions? Reply to this thread.`;
}

function stopReplyFor(orgName: string): string {
  return `You won't get any more texts from ${orgName}. Reply START to opt back in.`;
}

function resumeReplyFor(orgName: string): string {
  return `You're opted back in to ${orgName} updates. Reply STOP at any time.`;
}

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

  // CTIA-compliant keyword handling — runs *before* autopilot regardless of
  // its on/off state, since the carrier requirement is non-negotiable.
  const keyword = classifyKeyword(input.body);
  const businessName = data.connected ? data.companyName : input.org.name;
  if (keyword === "stop") {
    recordOptOut(input.org.id, input.fromPhone, "inbound_stop");
    setConversationAutopilotPaused(conversation.id, true);
    await maybeSendKeywordReply({
      org: input.org,
      conversationId: conversation.id,
      to: input.fromPhone,
      body: stopReplyFor(businessName),
    });
    return { conversation, replied: true, reason: "stop_keyword" };
  }
  if (keyword === "resume") {
    clearOptOut(input.org.id, input.fromPhone);
    setConversationAutopilotPaused(conversation.id, false);
    await maybeSendKeywordReply({
      org: input.org,
      conversationId: conversation.id,
      to: input.fromPhone,
      body: resumeReplyFor(businessName),
    });
    return { conversation, replied: true, reason: "resume_keyword" };
  }
  if (keyword === "help") {
    await maybeSendKeywordReply({
      org: input.org,
      conversationId: conversation.id,
      to: input.fromPhone,
      body: helpReplyFor(businessName),
    });
    return { conversation, replied: true, reason: "help_keyword" };
  }

  if (input.org.autopilotEnabled !== 1) {
    return { conversation, replied: false, reason: "autopilot_disabled" };
  }
  if (conversation.autopilotPaused === 1) {
    return { conversation, replied: false, reason: "autopilot_paused" };
  }

  const payUrl =
    customer && customer.amountOwed > 0
      ? getOrCreatePayLink(input.org.id, customer.id).url
      : null;

  // Pull the owner's SMS template — it's our best signal for how they talk
  // to customers, so Claude uses it as a voice anchor.
  const owner = findUserById(input.org.ownerUserId);
  const customerMeta = customer
    ? getCustomerMetadata(input.org.id, customer.id)
    : null;
  const ctx: AutopilotContext = {
    businessName,
    customerName: customer?.name ?? null,
    amountCentsOwed: customer?.amountOwed ?? 0,
    daysLate: customer?.daysLate ?? 0,
    payUrl,
    history: recentMessages(conversation.id, HISTORY_DEPTH),
    totalMessageCount: countMessagesInConversation(conversation.id),
    voiceExample: owner?.smsTemplate ?? null,
    toneOverride: customerMeta?.tone ?? null,
  };

  const result = await generateAutopilotReply(ctx);
  if (!result.ok) {
    return { conversation, replied: false, reason: result.error };
  }

  try {
    const sent = await sendRawSms({
      to: input.fromPhone,
      body: result.reply,
      organizationId: input.org.id,
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
    captureException(err, {
      where: "autopilot.send",
      organizationId: input.org.id,
      conversationId: conversation.id,
    });
    return { conversation, replied: false, reason: "send_failed" };
  }
}

async function maybeSendKeywordReply(input: {
  org: OrganizationRow;
  conversationId: number;
  to: string;
  body: string;
}): Promise<void> {
  try {
    const sent = await sendRawSms({
      to: input.to,
      body: input.body,
      organizationId: input.org.id,
      // Keyword acknowledgements bypass the opt-out suppression — STOP/HELP
      // confirmations are carrier-mandated even after the user opts out.
      bypassOptOut: true,
    });
    appendMessage({
      conversationId: input.conversationId,
      direction: "outbound",
      body: input.body,
      twilioSid: sent.sid,
      autopilot: false,
    });
  } catch (err) {
    captureException(err, {
      where: "sms.keyword_reply",
      organizationId: input.org.id,
      conversationId: input.conversationId,
    });
  }
}

function normalizePhone(p: string): string {
  // Loose normalization for matching: strip everything except digits, keep
  // the last 10 digits (US-centric — good enough for matching against the
  // free-form QBO PrimaryPhone string).
  const digits = p.replace(/\D+/g, "");
  return digits.slice(-10);
}
