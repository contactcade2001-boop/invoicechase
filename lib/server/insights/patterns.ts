import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Customer } from "@/lib/types";
import { getAnthropicApiKey } from "../env";
import {
  readCachedInsight,
  writeCachedInsight,
} from "../db/insightsCache";

export type Pattern = {
  scope: "customer" | "org";
  customerId?: string;
  customerName?: string;
  observation: string;
  confidence: "high" | "medium" | "low";
};

export type PatternsResult = {
  patterns: Pattern[];
  generatedAt: number;
  source: "claude" | "fallback";
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a payment-behavior analyst. You're given a snapshot of a small business's customers (balance, days late, reputation, contact info). Surface 2-4 observations that the business owner would find genuinely useful — patterns or risks they probably haven't spotted themselves.

Rules:
- Each observation must be specific. "Some customers are late" is useless. "Top 3 customers account for 62% of outstanding AR" is useful.
- Mix customer-specific patterns ("Riverside is the largest balance and has the lowest reputation — risky") with org-wide patterns ("Your overdue rate is 41% — well above the 15% healthy benchmark").
- Keep each observation under 160 characters.
- Confidence: "high" if the data strongly supports it, "medium" if reasonable, "low" if speculative.
- Output ONLY valid JSON: { "patterns": [...] }`;

function fallbackPatterns(customers: Customer[]): Pattern[] {
  const owing = customers.filter((c) => c.amountOwed > 0);
  if (owing.length === 0) return [];
  const out: Pattern[] = [];
  const total = owing.reduce((s, c) => s + c.amountOwed, 0);
  const top3 = [...owing]
    .sort((a, b) => b.amountOwed - a.amountOwed)
    .slice(0, 3);
  const top3Total = top3.reduce((s, c) => s + c.amountOwed, 0);
  const top3Pct = Math.round((top3Total / total) * 100);
  if (top3Pct >= 50) {
    out.push({
      scope: "org",
      observation: `Top 3 customers hold ${top3Pct}% of your outstanding AR — that's concentration risk worth diversifying.`,
      confidence: "high",
    });
  }
  const overdueRate = Math.round(
    (owing.filter((c) => c.daysLate > 0).length / owing.length) * 100,
  );
  if (overdueRate >= 30) {
    out.push({
      scope: "org",
      observation: `${overdueRate}% of customers with a balance are overdue — that's well above a healthy 15% mark.`,
      confidence: "high",
    });
  }
  const worst = [...owing].sort((a, b) => a.reputationScore - b.reputationScore)[0];
  if (worst && worst.reputationScore < 580 && worst.amountOwed > 100000) {
    out.push({
      scope: "customer",
      customerId: worst.id,
      customerName: worst.name,
      observation: `${worst.name} carries the largest poor-reputation balance — require deposits before any new work.`,
      confidence: "high",
    });
  }
  return out;
}

function buildUserPrompt(customers: Customer[]): string {
  const owing = customers
    .filter((c) => c.amountOwed > 0)
    .sort((a, b) => b.amountOwed - a.amountOwed)
    .slice(0, 25);
  const lines = owing.map(
    (c) =>
      `- id=${c.id} name="${c.name}" owed=$${(c.amountOwed / 100).toFixed(2)} days_late=${c.daysLate} rep=${c.reputationScore}/850`,
  );
  return [
    `Customer snapshot (${owing.length} customers with balance, sorted by balance):`,
    ...lines,
    "",
    'Return JSON: { "patterns": [ { "scope": "customer"|"org", "customerId": "<optional, only for customer scope>", "customerName": "<optional>", "observation": "<one sentence, under 160 chars>", "confidence": "high"|"medium"|"low" } ] }',
  ].join("\n");
}

async function callClaude(customers: Customer[]): Promise<Pattern[] | null> {
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
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as { patterns?: unknown[] };
    if (!Array.isArray(parsed.patterns)) return null;
    const customerIds = new Set(customers.map((c) => c.id));
    const validScopes = new Set(["customer", "org"]);
    const validConfidence = new Set(["high", "medium", "low"]);
    const out: Pattern[] = [];
    for (const raw of parsed.patterns) {
      if (!raw || typeof raw !== "object") continue;
      const p = raw as Record<string, unknown>;
      if (typeof p.scope !== "string" || !validScopes.has(p.scope)) continue;
      if (typeof p.observation !== "string") continue;
      if (typeof p.confidence !== "string" || !validConfidence.has(p.confidence))
        continue;
      const customerId =
        typeof p.customerId === "string" && customerIds.has(p.customerId)
          ? p.customerId
          : undefined;
      out.push({
        scope: p.scope as Pattern["scope"],
        customerId,
        customerName:
          typeof p.customerName === "string"
            ? p.customerName.slice(0, 120)
            : undefined,
        observation: p.observation.slice(0, 240),
        confidence: p.confidence as Pattern["confidence"],
      });
    }
    return out.slice(0, 4);
  } catch (err) {
    console.error("[insights.patterns] claude call failed", err);
    return null;
  }
}

export async function getBehavioralPatterns(
  organizationId: number,
  customers: Customer[],
): Promise<PatternsResult> {
  const cached = readCachedInsight<{
    patterns: Pattern[];
    source: "claude" | "fallback";
  }>(organizationId, "patterns");
  if (cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) {
    return {
      patterns: cached.payload.patterns,
      generatedAt: cached.generatedAt,
      source: cached.payload.source,
    };
  }

  const claudePatterns = await callClaude(customers);
  const result: { patterns: Pattern[]; source: "claude" | "fallback" } =
    claudePatterns && claudePatterns.length > 0
      ? { patterns: claudePatterns, source: "claude" }
      : { patterns: fallbackPatterns(customers), source: "fallback" };

  writeCachedInsight(organizationId, "patterns", result);
  return {
    patterns: result.patterns,
    generatedAt: Date.now(),
    source: result.source,
  };
}
