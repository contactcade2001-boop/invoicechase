import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { auditEvents, users } from "../db/schema";
import { eq } from "drizzle-orm";

export type LeaderboardRow = {
  userId: number;
  email: string;
  role: string;
  sends: number;
  fastPays: number;
  paymentsCollectedCents: number;
};

/**
 * Builds a leaderboard of who collected the most this month by aggregating
 * audit events: SMS sends, fast-pay actions, and successful payments tagged
 * with the userId of the actor.
 */
export function getLeaderboard(orgId: number): LeaderboardRow[] {
  const db = getDb();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const rows = db
    .select({
      userId: auditEvents.userId,
      kind: auditEvents.kind,
      meta: auditEvents.metadataJson,
    })
    .from(auditEvents)
    .where(
      sql`${auditEvents.organizationId} = ${orgId} AND ${auditEvents.createdAt} >= ${monthStart.getTime()} AND ${auditEvents.userId} IS NOT NULL`,
    )
    .all();

  const byUser = new Map<
    number,
    { sends: number; fastPays: number; collectedCents: number }
  >();

  for (const r of rows) {
    if (!r.userId) continue;
    const slot = byUser.get(r.userId) ?? {
      sends: 0,
      fastPays: 0,
      collectedCents: 0,
    };
    if (r.kind === "sms.send" || r.kind === "email.send") slot.sends += 1;
    else if (r.kind === "fast_pay.collected") {
      slot.fastPays += 1;
      const meta = r.meta ? JSON.parse(r.meta) : {};
      slot.collectedCents += Number(meta.amountCents ?? 0);
    } else if (r.kind === "payment.received") {
      const meta = r.meta ? JSON.parse(r.meta) : {};
      slot.collectedCents += Number(meta.amountCents ?? 0);
    }
    byUser.set(r.userId, slot);
  }

  const userIds = Array.from(byUser.keys());
  if (userIds.length === 0) return [];
  const userRows = db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(sql`${users.id} IN (${sql.join(userIds, sql`, `)})`)
    .all();
  const userById = new Map(userRows.map((u) => [u.id, u]));

  const board: LeaderboardRow[] = [];
  for (const [userId, slot] of byUser) {
    const u = userById.get(userId);
    if (!u) continue;
    board.push({
      userId,
      email: u.email,
      role: u.role,
      sends: slot.sends,
      fastPays: slot.fastPays,
      paymentsCollectedCents: slot.collectedCents,
    });
  }
  board.sort((a, b) => b.paymentsCollectedCents - a.paymentsCollectedCents);
  return board;
}
void eq;
