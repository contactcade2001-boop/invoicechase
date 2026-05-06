import "server-only";
import { createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { webhookEvents, type WebhookEventRow } from "./schema";

export type WebhookSource = "stripe" | "twilio";
export type WebhookStatus =
  | "received"
  | "processed"
  | "ignored"
  | "rejected"
  | "errored";

function digest(payload: string): string {
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function logWebhookEvent(input: {
  source: WebhookSource;
  eventId?: string | null;
  type?: string | null;
  status: WebhookStatus;
  errorMessage?: string | null;
  payload?: string;
}): WebhookEventRow {
  const db = getDb();
  return db
    .insert(webhookEvents)
    .values({
      source: input.source,
      eventId: input.eventId ?? null,
      type: input.type ?? null,
      status: input.status,
      errorMessage: input.errorMessage ?? null,
      payloadDigest: input.payload ? digest(input.payload) : null,
      createdAt: Date.now(),
    })
    .returning()
    .get();
}

export function isAlreadyProcessed(
  source: WebhookSource,
  eventId: string,
): boolean {
  if (!eventId) return false;
  const db = getDb();
  const rows = db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, eventId))
    .all();
  return rows.some(
    (r) => r.source === source && r.status === "processed",
  );
}

export function listRecentWebhookEvents(
  limit = 100,
): WebhookEventRow[] {
  const db = getDb();
  return db
    .select()
    .from(webhookEvents)
    .orderBy(desc(webhookEvents.createdAt))
    .limit(limit)
    .all();
}
