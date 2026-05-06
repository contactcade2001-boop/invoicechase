import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import {
  smsConversations,
  smsMessages,
  type SmsConversationRow,
  type SmsMessageRow,
} from "./schema";

export type SmsDirection = "inbound" | "outbound";

export function findConversationByPhone(
  organizationId: number,
  customerPhone: string,
): SmsConversationRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(smsConversations)
    .where(
      and(
        eq(smsConversations.organizationId, organizationId),
        eq(smsConversations.customerPhone, customerPhone),
      ),
    )
    .orderBy(desc(smsConversations.lastMessageAt))
    .limit(1)
    .get();
  return row ?? null;
}

export function getOrCreateConversation(input: {
  organizationId: number;
  customerPhone: string;
  customerId?: string | null;
  customerName?: string | null;
}): SmsConversationRow {
  const existing = findConversationByPhone(
    input.organizationId,
    input.customerPhone,
  );
  if (existing) return existing;
  const db = getDb();
  const now = Date.now();
  return db
    .insert(smsConversations)
    .values({
      organizationId: input.organizationId,
      customerPhone: input.customerPhone,
      customerId: input.customerId ?? null,
      customerName: input.customerName ?? null,
      lastMessageAt: now,
      createdAt: now,
    })
    .returning()
    .get();
}

export function appendMessage(input: {
  conversationId: number;
  direction: SmsDirection;
  body: string;
  twilioSid?: string | null;
  autopilot?: boolean;
}): SmsMessageRow {
  const db = getDb();
  const now = Date.now();
  const row = db
    .insert(smsMessages)
    .values({
      conversationId: input.conversationId,
      direction: input.direction,
      body: input.body,
      twilioSid: input.twilioSid ?? null,
      autopilot: input.autopilot ? 1 : 0,
      createdAt: now,
    })
    .returning()
    .get();
  db.update(smsConversations)
    .set({ lastMessageAt: now })
    .where(eq(smsConversations.id, input.conversationId))
    .run();
  return row;
}

export function recentMessages(
  conversationId: number,
  limit = 30,
): SmsMessageRow[] {
  const db = getDb();
  const rows = db
    .select()
    .from(smsMessages)
    .where(eq(smsMessages.conversationId, conversationId))
    .orderBy(desc(smsMessages.createdAt))
    .limit(limit)
    .all();
  return rows.reverse();
}

export function countMessagesInConversation(
  conversationId: number,
): number {
  const db = getDb();
  return db
    .select()
    .from(smsMessages)
    .where(eq(smsMessages.conversationId, conversationId))
    .all().length;
}

export function setConversationAutopilotPaused(
  conversationId: number,
  paused: boolean,
): void {
  const db = getDb();
  db.update(smsConversations)
    .set({ autopilotPaused: paused ? 1 : 0 })
    .where(eq(smsConversations.id, conversationId))
    .run();
}

export function findConversationById(
  id: number,
  organizationId: number,
): SmsConversationRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(smsConversations)
    .where(
      and(
        eq(smsConversations.id, id),
        eq(smsConversations.organizationId, organizationId),
      ),
    )
    .get();
  return row ?? null;
}

export function listConversationsForOrg(
  organizationId: number,
  limit = 50,
): SmsConversationRow[] {
  const db = getDb();
  return db
    .select()
    .from(smsConversations)
    .where(eq(smsConversations.organizationId, organizationId))
    .orderBy(desc(smsConversations.lastMessageAt))
    .limit(limit)
    .all();
}

export function listAllMessagesForConv(
  conversationId: number,
): SmsMessageRow[] {
  const db = getDb();
  return db
    .select()
    .from(smsMessages)
    .where(eq(smsMessages.conversationId, conversationId))
    .orderBy(asc(smsMessages.createdAt))
    .all();
}
