import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "./client";
import {
  inboxReads,
  smsConversations,
  type InboxReadRow,
} from "./schema";

export function markConversationRead(
  userId: number,
  conversationId: number,
): void {
  const db = getDb();
  const now = Date.now();
  db.insert(inboxReads)
    .values({ userId, conversationId, lastReadAt: now })
    .onConflictDoUpdate({
      target: [inboxReads.userId, inboxReads.conversationId],
      set: { lastReadAt: now },
    })
    .run();
}

export function getReadsForUser(
  userId: number,
  conversationIds: number[],
): Map<number, number> {
  const out = new Map<number, number>();
  if (conversationIds.length === 0) return out;
  const db = getDb();
  const rows: InboxReadRow[] = db
    .select()
    .from(inboxReads)
    .where(
      and(
        eq(inboxReads.userId, userId),
        inArray(inboxReads.conversationId, conversationIds),
      ),
    )
    .all();
  for (const r of rows) out.set(r.conversationId, r.lastReadAt);
  return out;
}

export function countUnreadForUser(
  userId: number,
  organizationId: number,
): number {
  const db = getDb();
  // Conversations in the user's org with at least one inbound message after
  // their last_read_at (or any inbound message if they've never read it).
  const convs = db
    .select()
    .from(smsConversations)
    .where(eq(smsConversations.organizationId, organizationId))
    .all();
  if (convs.length === 0) return 0;
  const reads = getReadsForUser(
    userId,
    convs.map((c) => c.id),
  );
  let unread = 0;
  for (const c of convs) {
    const lastRead = reads.get(c.id) ?? 0;
    if (c.lastMessageAt > lastRead) unread++;
  }
  return unread;
}
