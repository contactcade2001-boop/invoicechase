import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "./client";
import { customerMetadata } from "./schema";

export type CustomerMetadata = {
  organizationId: number;
  customerId: string;
  note: string | null;
  snoozedUntil: number | null;
  tags: string[];
  updatedAt: number;
};

function rowToMeta(r: {
  organizationId: number;
  customerId: string;
  note: string | null;
  snoozedUntil: number | null;
  tags: string | null;
  updatedAt: number;
}): CustomerMetadata {
  return {
    organizationId: r.organizationId,
    customerId: r.customerId,
    note: r.note,
    snoozedUntil: r.snoozedUntil,
    tags: r.tags ? r.tags.split(",").filter(Boolean) : [],
    updatedAt: r.updatedAt,
  };
}

export function getCustomerMetadata(
  orgId: number,
  customerId: string,
): CustomerMetadata | null {
  const db = getDb();
  const row = db
    .select()
    .from(customerMetadata)
    .where(
      and(
        eq(customerMetadata.organizationId, orgId),
        eq(customerMetadata.customerId, customerId),
      ),
    )
    .get();
  return row ? rowToMeta(row) : null;
}

export function listCustomerMetadata(
  orgId: number,
): Map<string, CustomerMetadata> {
  const db = getDb();
  const rows = db
    .select()
    .from(customerMetadata)
    .where(eq(customerMetadata.organizationId, orgId))
    .all();
  const map = new Map<string, CustomerMetadata>();
  for (const r of rows) map.set(r.customerId, rowToMeta(r));
  return map;
}

export function upsertCustomerMetadata(input: {
  organizationId: number;
  customerId: string;
  note?: string | null;
  snoozedUntil?: number | null;
  tags?: string[];
}): CustomerMetadata {
  const db = getDb();
  const existing = getCustomerMetadata(input.organizationId, input.customerId);
  const note = input.note !== undefined ? input.note : (existing?.note ?? null);
  const snoozedUntil =
    input.snoozedUntil !== undefined
      ? input.snoozedUntil
      : (existing?.snoozedUntil ?? null);
  const tags =
    input.tags !== undefined
      ? Array.from(new Set(input.tags.map((t) => t.trim()).filter(Boolean)))
      : (existing?.tags ?? []);
  const now = Date.now();
  db.insert(customerMetadata)
    .values({
      organizationId: input.organizationId,
      customerId: input.customerId,
      note,
      snoozedUntil,
      tags: tags.join(","),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [customerMetadata.organizationId, customerMetadata.customerId],
      set: {
        note,
        snoozedUntil,
        tags: tags.join(","),
        updatedAt: now,
      },
    })
    .run();
  return {
    organizationId: input.organizationId,
    customerId: input.customerId,
    note,
    snoozedUntil,
    tags,
    updatedAt: now,
  };
}

export function isSnoozed(meta: CustomerMetadata | undefined | null): boolean {
  return !!(meta?.snoozedUntil && meta.snoozedUntil > Date.now());
}
