import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { qboConnections, type QboConnectionRow } from "./schema";

export type ConnectionUpsert = {
  organizationId: number;
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
        organizationId: input.organizationId,
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

export function getConnectionForOrg(
  organizationId: number,
): QboConnectionRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(qboConnections)
    .where(eq(qboConnections.organizationId, organizationId))
    .orderBy(desc(qboConnections.updatedAt))
    .limit(1)
    .get();
  return row ?? null;
}

export function deleteConnectionForOrg(
  organizationId: number,
  realmId: string,
): void {
  const db = getDb();
  db.delete(qboConnections)
    .where(
      and(
        eq(qboConnections.organizationId, organizationId),
        eq(qboConnections.realmId, realmId),
      ),
    )
    .run();
}

export function listAllConnections(): QboConnectionRow[] {
  const db = getDb();
  return db.select().from(qboConnections).all();
}
