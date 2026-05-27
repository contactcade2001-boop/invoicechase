import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Customer } from "@/lib/types";
import { getAnthropicApiKey } from "../env";
import {
  readCachedInsight,
  writeCachedInsight,
} from "../db/insightsCache";

export type Play = {
  customerId: string;
  customerName: string;
  action: "text" | "email" | "call" | "payment_plan" | "deposit" | "escalate";
  reason: string;
  expectedCents: number;
};

export type PlaysResult = {
  plays: Play[];
  generatedAt: number;
  source: "claude" | "fallback";
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a collections strategist. You're handed a list of overdue customers for a small business. Pick the top 3-5 highest-ROI next actions to take TODAY to maximize cash collected with the least effort.

Rules:
- Prefer customers where a single nudge unlocks the most cash (large balance + good reputation + has phone/email).
- Recommend "payment_plan" for very high balances on customers with mid-low reputation.
- Recommend "deposit" only for customers with poor reputation (<580 score) who haven't been billed yet — don't suggest for currently-overdue accounts.
- Recommend "escalate" only for accounts >90 days late where multiple reminders have already failed.
- expectedCents should be a realistic estimate of $ collected from this single action (not the full balance — discount by probability).
- Keep "reason" under 120 chars, action-oriented, specific to this customer (mention the balance, days late, or reputation).
- Output ONLY valid JSON: { "plays": [...] }`;

function fallbackPlays(customers: Customer[]): Play[] {
  // Simple rule-based fallback when Claude isn't available — pick the
  // 3 largest overdue customers with phones.
  return customers
    .filter((c) => c.daysLate > 0 && c.amountOwed > 0)
    .sort((a, b) => b.amountOwed - a.amountOwed)
    .slice(0, 3)
    .map((c) => ({
      customerId: c.id,
      customerName: c.name,
      action: c.phone ? "text" : "email",
      reason: c.phone
        ? `Largest overdue (${Math.round(c.amountOwed / 100)} owed, ${c.daysLate} days late) — text first.`
        : `${c.daysLate} days late, $${Math.round(c.amountOwed / 100)} owed. Email the fastest path.`,
      expectedCents: Math.round(c.amountOwed * 0.6),
    }));
}

function buildUserPrompt(customers: Customer[]): string {
  const overdue = customers
    .filter((c) => c.daysLate > 0 && c.amountOwed > 0)
    .sort((a, b) => b.amountOwed - a.amountOwed)
    .slice(0, 15);
  const lines = overdue.map(
    (c, i) =>
      `${i + 1}. ${c.name} — owes $${(c.amountOwed / 100).toFixed(2)}, ${c.daysLate} days late, reputation ${c.reputationScore}/850, phone=${c.phone ? "yes" : "no"}, email=${c.email ? "yes" : "no"}`,
  );
  return [
    "Overdue customers (top 15 by amount):",
    ...lines,
    "",
    'Return JSON: { "plays": [{ "customerId": "<id from list>", "customerName": "...", "action": "text|email|call|payment_plan|deposit|escalate", "reason": "<one sentence>", "expectedCents": <integer> }, ...] }',
    "",
    'IMPORTANT: customerId must EXACTLY match the customer from the list. Use the index+name to identify them.',
  ].join("\n");
}

async function callClaude(customers: Customer[]): Promise<Play[] | null> {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) return null;
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(customers) }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    // Find the first JSON object in the response and parse it.
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as { plays?: unknown[] };
    if (!Array.isArray(parsed.plays)) return null;
    // Light validation — coerce to safe shape, drop bad entries.
    const validCustomerIds = new Set(customers.map((c) => c.id));
    const validActions = new Set([
      "text",
      "email",
      "call",
      "payment_plan",
      "deposit",
      "escalate",
    ]);
    const plays: Play[] = [];
    for (const raw of parsed.plays) {
      if (!raw || typeof raw !== "object") continue;
      const p = raw as Record<string, unknown>;
      if (typeof p.customerId !== "string" || !validCustomerIds.has(p.customerId)) continue;
      if (typeof p.action !== "string" || !validActions.has(p.action)) continue;
      if (typeof p.customerName !== "string") continue;
      if (typeof p.reason !== "string") continue;
      const expected =
        typeof p.expectedCents === "number" ? Math.round(p.expectedCents) : 0;
      plays.push({
        customerId: p.customerId,
        customerName: p.customerName.slice(0, 120),
        action: p.action as Play["action"],
        reason: p.reason.slice(0, 200),
        expectedCents: Math.max(0, expected),
      });
    }
    return plays.slice(0, 5);
  } catch (err) {
    console.error("[insights.plays] claude call failed", err);
    return null;
  }
}

export async function getTodaysPlays(
  organizationId: number,
  customers: Customer[],
): Promise<PlaysResult> {
  const cached = readCachedInsight<{ plays: Play[]; source: "claude" | "fallback" }>(
    organizationId,
    "plays",
  );
  if (cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) {
    return {
      plays: cached.payload.plays,
      generatedAt: cached.generatedAt,
      source: cached.payload.source,
    };
  }

  const claudePlays = await callClaude(customers);
  const result: { plays: Play[]; source: "claude" | "fallback" } =
    claudePlays && claudePlays.length > 0
      ? { plays: claudePlays, source: "claude" }
      : { plays: fallbackPlays(customers), source: "fallback" };

  writeCachedInsight(organizationId, "plays", result);
  return {
    plays: result.plays,
    generatedAt: Date.now(),
    source: result.source,
  };
}
