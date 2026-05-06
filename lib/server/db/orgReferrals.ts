import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { orgReferrals, type OrgReferralRow } from "./schema";

export function recordOrgReferral(input: {
  referrerOrgId: number;
  refereeOrgId: number;
}): OrgReferralRow | null {
  const now = Date.now();
  const inserted = getDb()
    .insert(orgReferrals)
    .values({
      referrerOrgId: input.referrerOrgId,
      refereeOrgId: input.refereeOrgId,
      creditStatus: "pending",
      createdAt: now,
    })
    .onConflictDoNothing({ target: orgReferrals.refereeOrgId })
    .returning()
    .get();
  return inserted ?? null;
}

export function listOrgReferralsForOrg(
  referrerOrgId: number,
): OrgReferralRow[] {
  return getDb()
    .select()
    .from(orgReferrals)
    .where(eq(orgReferrals.referrerOrgId, referrerOrgId))
    .orderBy(desc(orgReferrals.createdAt))
    .all();
}

export function findOrgReferralByReferee(
  refereeOrgId: number,
): OrgReferralRow | null {
  return (
    getDb()
      .select()
      .from(orgReferrals)
      .where(eq(orgReferrals.refereeOrgId, refereeOrgId))
      .get() ?? null
  );
}

export function markOrgReferralCredited(refereeOrgId: number): void {
  const now = Date.now();
  getDb()
    .update(orgReferrals)
    .set({ creditStatus: "credited", creditedAt: now })
    .where(eq(orgReferrals.refereeOrgId, refereeOrgId))
    .run();
}
