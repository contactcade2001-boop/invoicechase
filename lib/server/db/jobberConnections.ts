import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import {
  jobberConnections,
  type JobberConnectionRow,
} from "./schema";

export type JobberConnectionUpsert = {
  organizationId: number;
  accountId: string;
  accountName: string | null;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

export function getJobberConnectionForOrg(
  organizationId: number,
): JobberConnectionRow | null {
  return (
    getDb()
      .select()
      .from(jobberConnections)
      .where(eq(jobberConnections.organizationId, organizationId))
      .get() ?? null
  );
}

export function upsertJobberConnection(input: JobberConnectionUpsert): void {
  const now = Date.now();
  getDb()
    .insert(jobberConnections)
    .values({
      ...input,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: jobberConnections.organizationId,
      set: {
        accountId: input.accountId,
        accountName: input.accountName,
        accessTokenEnc: input.accessTokenEnc,
        refreshTokenEnc: input.refreshTokenEnc,
        accessTokenExpiresAt: input.accessTokenExpiresAt,
        refreshTokenExpiresAt: input.refreshTokenExpiresAt,
        updatedAt: now,
      },
    })
    .run();
}

export function deleteJobberConnection(organizationId: number): void {
  getDb()
    .delete(jobberConnections)
    .where(eq(jobberConnections.organizationId, organizationId))
    .run();
}
