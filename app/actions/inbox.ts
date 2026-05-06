"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth/session";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import {
  appendMessage,
  findConversationById,
  setConversationAutopilotPaused,
} from "@/lib/server/db/sms";
import { LIMITS, checkRateLimit } from "@/lib/server/rateLimit";
import { OptedOutError, sendRawSms } from "@/lib/server/twilio/sms";

export type InboxResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendManualReply(input: {
  conversationId: number;
  body: string;
}): Promise<InboxResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role === "technician") return { ok: false, error: "forbidden" };
  const orgId = user.organizationId;
  if (!orgId) return { ok: false, error: "no_organization" };

  const trimmed = input.body.trim();
  if (!trimmed) return { ok: false, error: "empty_body" };
  if (trimmed.length > 1600) return { ok: false, error: "too_long" };

  const conv = findConversationById(input.conversationId, orgId);
  if (!conv) return { ok: false, error: "not_found" };

  const limit = checkRateLimit(
    `sms:min:${orgId}`,
    LIMITS.smsPerMinute.max,
    LIMITS.smsPerMinute.windowMs,
  );
  if (!limit.allowed) return { ok: false, error: "rate_limited" };

  // A human just stepped in — autopause autopilot for this thread so the
  // bot doesn't tag-team the customer with a duplicate response.
  if (conv.autopilotPaused !== 1) {
    setConversationAutopilotPaused(conv.id, true);
  }

  try {
    const sent = await sendRawSms({
      to: conv.customerPhone,
      body: trimmed,
      organizationId: orgId,
    });
    appendMessage({
      conversationId: conv.id,
      direction: "outbound",
      body: trimmed,
      twilioSid: sent.sid,
      autopilot: false,
    });
    logAuditEvent({
      organizationId: orgId,
      userId: user.id,
      actorEmail: user.email,
      kind: "sms.manual_reply_sent",
      targetType: "conversation",
      targetId: String(conv.id),
      metadata: { phone: conv.customerPhone },
    });
    revalidatePath(`/inbox/${conv.id}`);
    revalidatePath("/inbox");
    return { ok: true };
  } catch (err) {
    if (err instanceof OptedOutError) {
      return { ok: false, error: "opted_out" };
    }
    console.error("[inbox] send failed", err);
    return { ok: false, error: "send_failed" };
  }
}

export async function setAutopilotForConversation(input: {
  conversationId: number;
  paused: boolean;
}): Promise<InboxResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role === "technician") return { ok: false, error: "forbidden" };
  const orgId = user.organizationId;
  if (!orgId) return { ok: false, error: "no_organization" };
  const conv = findConversationById(input.conversationId, orgId);
  if (!conv) return { ok: false, error: "not_found" };
  setConversationAutopilotPaused(conv.id, input.paused);
  logAuditEvent({
    organizationId: orgId,
    userId: user.id,
    actorEmail: user.email,
    kind: input.paused ? "sms.autopilot_paused" : "sms.autopilot_resumed",
    targetType: "conversation",
    targetId: String(conv.id),
    metadata: { phone: conv.customerPhone },
  });
  revalidatePath(`/inbox/${conv.id}`);
  revalidatePath("/inbox");
  return { ok: true };
}
