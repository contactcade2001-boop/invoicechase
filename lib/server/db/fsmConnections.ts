import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import {
  fieldPulseConnections,
  housecallProConnections,
  serviceTitanConnections,
  workizConnections,
  type FieldPulseConnectionRow,
  type HousecallProConnectionRow,
  type ServiceTitanConnectionRow,
  type WorkizConnectionRow,
} from "./schema";

// ── Housecall Pro ─────────────────────────────────────────────────────────────

export function getHousecallProConnection(
  organizationId: number,
): HousecallProConnectionRow | null {
  return (
    getDb()
      .select()
      .from(housecallProConnections)
      .where(eq(housecallProConnections.organizationId, organizationId))
      .get() ?? null
  );
}

export function upsertHousecallProConnection(input: {
  organizationId: number;
  accountId: string | null;
  accountName: string | null;
  accessTokenEnc: string;
  refreshTokenEnc: string | null;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number | null;
}): void {
  const now = Date.now();
  getDb()
    .insert(housecallProConnections)
    .values({ ...input, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: housecallProConnections.organizationId,
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

export function deleteHousecallProConnection(organizationId: number): void {
  getDb()
    .delete(housecallProConnections)
    .where(eq(housecallProConnections.organizationId, organizationId))
    .run();
}

// ── ServiceTitan ──────────────────────────────────────────────────────────────

export function getServiceTitanConnection(
  organizationId: number,
): ServiceTitanConnectionRow | null {
  return (
    getDb()
      .select()
      .from(serviceTitanConnections)
      .where(eq(serviceTitanConnections.organizationId, organizationId))
      .get() ?? null
  );
}

export function upsertServiceTitanConnection(input: {
  organizationId: number;
  tenantId: string;
  tenantName: string | null;
  accessTokenEnc: string;
  refreshTokenEnc: string | null;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number | null;
}): void {
  const now = Date.now();
  getDb()
    .insert(serviceTitanConnections)
    .values({ ...input, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: serviceTitanConnections.organizationId,
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

export function deleteServiceTitanConnection(organizationId: number): void {
  getDb()
    .delete(serviceTitanConnections)
    .where(eq(serviceTitanConnections.organizationId, organizationId))
    .run();
}

// ── FieldPulse (API key auth) ─────────────────────────────────────────────────

export function getFieldPulseConnection(
  organizationId: number,
): FieldPulseConnectionRow | null {
  return (
    getDb()
      .select()
      .from(fieldPulseConnections)
      .where(eq(fieldPulseConnections.organizationId, organizationId))
      .get() ?? null
  );
}

export function upsertFieldPulseConnection(input: {
  organizationId: number;
  accountName: string | null;
  apiKeyEnc: string;
}): void {
  const now = Date.now();
  getDb()
    .insert(fieldPulseConnections)
    .values({ ...input, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: fieldPulseConnections.organizationId,
      set: {
        accountName: input.accountName,
        apiKeyEnc: input.apiKeyEnc,
        updatedAt: now,
      },
    })
    .run();
}

export function deleteFieldPulseConnection(organizationId: number): void {
  getDb()
    .delete(fieldPulseConnections)
    .where(eq(fieldPulseConnections.organizationId, organizationId))
    .run();
}

// ── Workiz (API token + secret) ───────────────────────────────────────────────

export function getWorkizConnection(
  organizationId: number,
): WorkizConnectionRow | null {
  return (
    getDb()
      .select()
      .from(workizConnections)
      .where(eq(workizConnections.organizationId, organizationId))
      .get() ?? null
  );
}

export function upsertWorkizConnection(input: {
  organizationId: number;
  accountName: string | null;
  apiTokenEnc: string;
  apiSecretEnc: string | null;
}): void {
  const now = Date.now();
  getDb()
    .insert(workizConnections)
    .values({ ...input, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: workizConnections.organizationId,
      set: {
        accountName: input.accountName,
        apiTokenEnc: input.apiTokenEnc,
        apiSecretEnc: input.apiSecretEnc,
        updatedAt: now,
      },
    })
    .run();
}

export function deleteWorkizConnection(organizationId: number): void {
  getDb()
    .delete(workizConnections)
    .where(eq(workizConnections.organizationId, organizationId))
    .run();
}
