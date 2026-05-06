import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { qboConnections, type QboConnectionRow } from "./schema";

export type ConnectionUpsert = {
  realmId: string;
  companyName: string | null;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

export function upsertConnection(input: ConnectionUpsert): void {
  const db = getDb();
  const now = Date.now();
  db.insert(qboConnections)
    .values({
      ...input,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: qboConnections.realmId,
      set: {
        companyName: input.companyName,
        accessTokenEnc: input.accessTokenEnc,
        refreshTokenEnc: input.refreshTokenEnc,
        accessTokenExpiresAt: input.accessTokenExpiresAt,
        refreshTokenExpiresAt: input.refreshTokenExpiresAt,
        updatedAt: now,
      },
    })
    .run();
}

export function getActiveConnection(): QboConnectionRow | null {
  const db = getDb();
  const rows = db
    .select()
    .from(qboConnections)
    .orderBy(desc(qboConnections.updatedAt))
    .limit(1)
    .all();
  return rows[0] ?? null;
}

export function deleteConnection(realmId: string): void {
  const db = getDb();
  db.delete(qboConnections).where(eq(qboConnections.realmId, realmId)).run();
}
