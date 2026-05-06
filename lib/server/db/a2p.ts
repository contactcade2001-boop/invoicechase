import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { a2pRegistrations, type A2pRegistrationRow } from "./schema";

export type A2pStatus =
  | "not_started"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected";

export function getA2pRegistration(
  organizationId: number,
): A2pRegistrationRow | null {
  return (
    getDb()
      .select()
      .from(a2pRegistrations)
      .where(eq(a2pRegistrations.organizationId, organizationId))
      .get() ?? null
  );
}

export function upsertA2pRegistration(input: {
  organizationId: number;
  brandId?: string | null;
  campaignId?: string | null;
  brandStatus?: A2pStatus;
  campaignStatus?: A2pStatus;
  legalBusinessName?: string | null;
  businessEin?: string | null;
}): void {
  const now = Date.now();
  const existing = getA2pRegistration(input.organizationId);
  const next = {
    organizationId: input.organizationId,
    brandId: input.brandId ?? existing?.brandId ?? null,
    campaignId: input.campaignId ?? existing?.campaignId ?? null,
    brandStatus:
      input.brandStatus ?? existing?.brandStatus ?? "not_started",
    campaignStatus:
      input.campaignStatus ?? existing?.campaignStatus ?? "not_started",
    legalBusinessName:
      input.legalBusinessName ?? existing?.legalBusinessName ?? null,
    businessEin: input.businessEin ?? existing?.businessEin ?? null,
    submittedAt:
      input.brandStatus === "submitted" || input.campaignStatus === "submitted"
        ? (existing?.submittedAt ?? now)
        : (existing?.submittedAt ?? null),
    approvedAt:
      input.campaignStatus === "approved"
        ? (existing?.approvedAt ?? now)
        : (existing?.approvedAt ?? null),
    updatedAt: now,
  };
  getDb()
    .insert(a2pRegistrations)
    .values(next)
    .onConflictDoUpdate({
      target: a2pRegistrations.organizationId,
      set: next,
    })
    .run();
}

export function isA2pApproved(organizationId: number): boolean {
  const row = getA2pRegistration(organizationId);
  return row?.campaignStatus === "approved";
}
