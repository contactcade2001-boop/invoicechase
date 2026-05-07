import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { xeroConnections, type XeroConnectionRow } from "./schema";

export type XeroConnectionUpsert = {
  organizationId: number;
  tenantId: string;
  tenantName: string | null;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

export function getXeroConnectionForOrg(
  organizationId: number,
): XeroConnectionRow | null {
  return (
    getDb()
      .select()
      .from(xeroConnections)
      .where(eq(xeroConnections.organizationId, organizationId))
      .get() ?? null
  );
}

export function upsertXeroConnection(input: XeroConnectionUpsert): void {
  const now = Date.now();
  getDb()
    .insert(xeroConnections)
    .values({
      ...input,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: xeroConnections.organizationId,
      set: {
        tenantId: input.tenantId,
        tenantName: input.tenantName,
        accessTokenEnc: input.accessTokenEnc,
        refreshTokenEnc: input.refreshTokenEnc,
        accessTokenExpiresAt: input.accessTokenExpiresAt,
        refreshTokenExpiresAt: input.refreshTokenExpiresAt,
        updatedAt: now,
      },
    })
    .run();
}

export function deleteXeroConnection(organizationId: number): void {
  getDb()
    .delete(xeroConnections)
    .where(eq(xeroConnections.organizationId, organizationId))
    .run();
}

export function listXeroConnections(): XeroConnectionRow[] {
  return getDb().select().from(xeroConnections).all();
}
