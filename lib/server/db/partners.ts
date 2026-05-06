import "server-only";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./client";
import {
  partnerCommissions,
  partnerReferrals,
  partners,
  type PartnerCommissionRow,
  type PartnerReferralRow,
  type PartnerRow,
} from "./schema";

export function findPartnerByUserId(userId: number): PartnerRow | null {
  return (
    getDb()
      .select()
      .from(partners)
      .where(eq(partners.userId, userId))
      .get() ?? null
  );
}

export function findPartnerByCode(code: string): PartnerRow | null {
  return (
    getDb()
      .select()
      .from(partners)
      .where(eq(partners.referralCode, code))
      .get() ?? null
  );
}

export function findPartnerById(id: number): PartnerRow | null {
  return (
    getDb().select().from(partners).where(eq(partners.id, id)).get() ?? null
  );
}

export function createPartner(input: {
  userId: number;
  email: string;
  displayName: string | null;
  companyName: string | null;
  referralCode: string;
  payoutEmail: string | null;
}): PartnerRow {
  const now = Date.now();
  const result = getDb()
    .insert(partners)
    .values({
      userId: input.userId,
      email: input.email,
      displayName: input.displayName,
      companyName: input.companyName,
      referralCode: input.referralCode,
      payoutEmail: input.payoutEmail,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();
  return result;
}

export function markWelcomeEmailSent(partnerId: number): void {
  getDb()
    .update(partners)
    .set({ welcomeEmailSentAt: Date.now(), updatedAt: Date.now() })
    .where(eq(partners.id, partnerId))
    .run();
}

export function recordReferral(input: {
  partnerId: number;
  organizationId: number;
}): PartnerReferralRow | null {
  const now = Date.now();
  // onConflictDoNothing on the unique organization_id — first attribution
  // wins, so a switched referral cookie can't reassign an established org.
  const inserted = getDb()
    .insert(partnerReferrals)
    .values({
      partnerId: input.partnerId,
      organizationId: input.organizationId,
      attributedAt: now,
      createdAt: now,
    })
    .onConflictDoNothing({ target: partnerReferrals.organizationId })
    .returning()
    .get();
  return inserted ?? null;
}

export function findReferralByOrganization(
  organizationId: number,
): PartnerReferralRow | null {
  return (
    getDb()
      .select()
      .from(partnerReferrals)
      .where(eq(partnerReferrals.organizationId, organizationId))
      .get() ?? null
  );
}

export function listReferralsForPartner(
  partnerId: number,
): PartnerReferralRow[] {
  return getDb()
    .select()
    .from(partnerReferrals)
    .where(eq(partnerReferrals.partnerId, partnerId))
    .orderBy(desc(partnerReferrals.attributedAt))
    .all();
}

export function markReferralFirstPaid(
  organizationId: number,
  paidAtMs: number,
): void {
  getDb()
    .update(partnerReferrals)
    .set({ firstPaidAt: paidAtMs })
    .where(
      and(
        eq(partnerReferrals.organizationId, organizationId),
        sql`${partnerReferrals.firstPaidAt} IS NULL`,
      ),
    )
    .run();
}

export function listCommissionsForPartner(
  partnerId: number,
): PartnerCommissionRow[] {
  return getDb()
    .select()
    .from(partnerCommissions)
    .where(eq(partnerCommissions.partnerId, partnerId))
    .orderBy(desc(partnerCommissions.periodStart))
    .all();
}

export function listCommissionsInPeriod(
  periodStart: number,
  periodEnd: number,
): PartnerCommissionRow[] {
  return getDb()
    .select()
    .from(partnerCommissions)
    .where(
      and(
        gte(partnerCommissions.periodStart, periodStart),
        lte(partnerCommissions.periodEnd, periodEnd),
      ),
    )
    .all();
}

export function upsertCommission(input: {
  partnerId: number;
  organizationId: number;
  periodStart: number;
  periodEnd: number;
  source: "subscription" | "platform_fee";
  basisCents: number;
  commissionCents: number;
}): void {
  const now = Date.now();
  // Only refresh the snapshot while the row is still pending — once it's
  // paid out, the historical numbers stay frozen.
  getDb()
    .insert(partnerCommissions)
    .values({
      partnerId: input.partnerId,
      organizationId: input.organizationId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      basisCents: input.basisCents,
      commissionCents: input.commissionCents,
      source: input.source,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        partnerCommissions.partnerId,
        partnerCommissions.organizationId,
        partnerCommissions.periodStart,
        partnerCommissions.source,
      ],
      set: {
        basisCents: sql`CASE WHEN ${partnerCommissions.status} = 'pending' THEN excluded.basis_cents ELSE ${partnerCommissions.basisCents} END`,
        commissionCents: sql`CASE WHEN ${partnerCommissions.status} = 'pending' THEN excluded.commission_cents ELSE ${partnerCommissions.commissionCents} END`,
        updatedAt: now,
      },
    })
    .run();
}

export function findCommissionById(
  commissionId: number,
): PartnerCommissionRow | null {
  return (
    getDb()
      .select()
      .from(partnerCommissions)
      .where(eq(partnerCommissions.id, commissionId))
      .get() ?? null
  );
}

export function markCommissionPaid(
  commissionId: number,
  payoutReference: string | null,
): void {
  const now = Date.now();
  getDb()
    .update(partnerCommissions)
    .set({
      status: "paid",
      paidAt: now,
      payoutReference,
      updatedAt: now,
    })
    .where(eq(partnerCommissions.id, commissionId))
    .run();
}

export function setPartnerStripeAccount(
  partnerId: number,
  stripeAccountId: string,
): void {
  const now = Date.now();
  getDb()
    .update(partners)
    .set({ stripeAccountId, updatedAt: now })
    .where(eq(partners.id, partnerId))
    .run();
}

export function markCommissionTransferred(
  commissionId: number,
  stripeTransferId: string,
): void {
  const now = Date.now();
  getDb()
    .update(partnerCommissions)
    .set({
      status: "paid",
      paidAt: now,
      stripeTransferId,
      payoutReference: stripeTransferId,
      updatedAt: now,
    })
    .where(eq(partnerCommissions.id, commissionId))
    .run();
}

export function partnerEarningsSummary(partnerId: number): {
  pendingCents: number;
  paidCents: number;
  lifetimeCents: number;
} {
  const rows = getDb()
    .select({
      status: partnerCommissions.status,
      total: sql<number>`COALESCE(SUM(${partnerCommissions.commissionCents}), 0)`,
    })
    .from(partnerCommissions)
    .where(eq(partnerCommissions.partnerId, partnerId))
    .groupBy(partnerCommissions.status)
    .all();
  let pending = 0;
  let paid = 0;
  for (const r of rows) {
    if (r.status === "pending") pending = r.total;
    else if (r.status === "paid") paid = r.total;
  }
  return {
    pendingCents: pending,
    paidCents: paid,
    lifetimeCents: pending + paid,
  };
}
