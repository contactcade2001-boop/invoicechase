import "server-only";
import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "./client";
import { reminderSends, type ReminderSendRow } from "./schema";

export function findRecentSend(input: {
  organizationId: number;
  customerId: string;
  tone: string;
  sinceMs: number;
}): ReminderSendRow | null {
  return (
    getDb()
      .select()
      .from(reminderSends)
      .where(
        and(
          eq(reminderSends.organizationId, input.organizationId),
          eq(reminderSends.customerId, input.customerId),
          eq(reminderSends.tone, input.tone),
          gte(reminderSends.sentAt, input.sinceMs),
        ),
      )
      .orderBy(desc(reminderSends.sentAt))
      .get() ?? null
  );
}

export function recordReminderSend(input: {
  organizationId: number;
  customerId: string;
  tone: string;
  channel: string;
}): void {
  const now = Date.now();
  getDb()
    .insert(reminderSends)
    .values({
      organizationId: input.organizationId,
      customerId: input.customerId,
      tone: input.tone,
      channel: input.channel,
      sentAt: now,
      createdAt: now,
    })
    .run();
}
