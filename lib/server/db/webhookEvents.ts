import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, gte, like, lt } from "drizzle-orm";
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
  organizationId?: number | null;
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
      organizationId: input.organizationId ?? null,
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

export type WebhookEventFilters = {
  source?: WebhookSource;
  status?: WebhookStatus;
  typeQuery?: string;
  sinceMs?: number;
};

export function listWebhookEventsForOrg(
  organizationId: number,
  options: { limit?: number; offset?: number } & WebhookEventFilters = {},
): WebhookEventRow[] {
  const db = getDb();
  const limit = options.limit ?? 200;
  const offset = options.offset ?? 0;
  const filters = [eq(webhookEvents.organizationId, organizationId)];
  if (options.source) filters.push(eq(webhookEvents.source, options.source));
  if (options.status) filters.push(eq(webhookEvents.status, options.status));
  if (options.typeQuery && options.typeQuery.trim()) {
    filters.push(like(webhookEvents.type, `%${options.typeQuery.trim()}%`));
  }
  if (options.sinceMs && options.sinceMs > 0) {
    filters.push(gte(webhookEvents.createdAt, options.sinceMs));
  }
  return db
    .select()
    .from(webhookEvents)
    .where(and(...filters))
    .orderBy(desc(webhookEvents.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

export function pruneWebhookEventsOlderThan(cutoffMs: number): number {
  const db = getDb();
  const result = db
    .delete(webhookEvents)
    .where(lt(webhookEvents.createdAt, cutoffMs))
    .run();
  return Number(result.changes ?? 0);
}

// Best-effort: if the caller knows both org and event id, prefer the most
// recent matching row (rejected/received gets overwritten by processed).
export function findWebhookEventForOrgByEventId(
  organizationId: number,
  eventId: string,
): WebhookEventRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(webhookEvents)
    .where(
      and(
        eq(webhookEvents.organizationId, organizationId),
        eq(webhookEvents.eventId, eventId),
      ),
    )
    .orderBy(desc(webhookEvents.createdAt))
    .limit(1)
    .get();
  return row ?? null;
}
