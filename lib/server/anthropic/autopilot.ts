import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "../env";
import type { SmsMessageRow } from "../db/schema";

let _client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (_client) return _client;
  const apiKey = getAnthropicApiKey();
  if (!apiKey) return null;
  _client = new Anthropic({ apiKey });
  return _client;
}

export type AutopilotContext = {
  businessName: string;
  customerName: string | null;
  amountCentsOwed: number;
  daysLate: number;
  payUrl: string | null;
  history: SmsMessageRow[];
  totalMessageCount?: number;
  // Owner's saved SMS template — fed to Claude as a voice example so the
  // reply matches the business owner's tone instead of generic AI-speak.
  voiceExample?: string | null;
};

const SYSTEM_PROMPT = `You are a polite, professional collections assistant texting on behalf of a small business.

Rules:
- Always be brief (under 160 characters when possible).
- Match the business owner's tone exactly — if they're casual, be casual; if they're formal, be formal. A "voice example" of their writing may be provided below.
- Never be aggressive, judgmental, or threatening. Treat the customer with respect.
- Never invent invoice numbers, dates, or amounts that weren't provided.
- If the customer asks for a payment link, share the one provided.
- If the customer says they've already paid, thank them and say the business will reconcile their records.
- If the customer asks to stop texts, reply briefly acknowledging and stop.
- If the customer asks a complex question (dispute, refund, billing detail), say a teammate from the business will follow up directly. Do not invent specifics.
- Never agree to extensions, discounts, or payment plans on the business's behalf — defer those decisions to the business.
- Sign off naturally; don't use signatures or formal closings.
- Never identify yourself as an AI or refer to "the business owner" in third person — speak AS the business.`;

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function buildUserPrompt(ctx: AutopilotContext): string {
  const last = ctx.history[ctx.history.length - 1];
  const prior = ctx.history
    .slice(0, -1)
    .map(
      (m) =>
        `${m.direction === "inbound" ? "Customer" : ctx.businessName}: ${m.body}`,
    )
    .join("\n");
  const truncated =
    ctx.totalMessageCount && ctx.totalMessageCount > ctx.history.length
      ? ctx.totalMessageCount - ctx.history.length
      : 0;
  const voice = ctx.voiceExample?.trim();
  return [
    `Business: ${ctx.businessName}`,
    ctx.customerName ? `Customer: ${ctx.customerName}` : null,
    `Amount currently owed: ${formatCurrency(ctx.amountCentsOwed)}`,
    `Days late: ${ctx.daysLate}`,
    ctx.payUrl ? `Active payment link: ${ctx.payUrl}` : null,
    truncated > 0
      ? `(Earlier in this thread: ${truncated} prior message${truncated === 1 ? "" : "s"} not shown.)`
      : null,
    voice
      ? `\nOwner's voice example (match this tone — sentence length, formality, vocabulary):\n"""\n${voice}\n"""`
      : null,
    "",
    prior ? `Recent conversation:\n${prior}\n` : null,
    `Latest message from the customer: "${last?.body ?? ""}"`,
    "",
    "Write a short SMS reply (under 160 characters when possible) in the owner's voice.",
  ]
    .filter(Boolean)
    .join("\n");
}

export type AutopilotResult =
  | { ok: true; reply: string }
  | { ok: false; error: string };

export async function generateAutopilotReply(
  ctx: AutopilotContext,
): Promise<AutopilotResult> {
  const client = getClient();
  if (!client) return { ok: false, error: "no_api_key" };
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(ctx) }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!text) return { ok: false, error: "empty_response" };
    return { ok: true, reply: text.slice(0, 320) };
  } catch (err) {
    console.error("[autopilot] anthropic call failed", err);
    return { ok: false, error: "call_failed" };
  }
}
