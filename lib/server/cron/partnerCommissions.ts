import "server-only";
import {
  findPartnerById,
  listReferralsForPartner,
  upsertCommission,
} from "../db/partners";
import { getDb } from "../db/client";
import { partnerReferrals } from "../db/schema";
import { sumPlatformFeesInPeriod } from "../db/payments";
import { getSubscriptionByOrgId, isActive } from "../db/subscriptions";
import { captureException } from "../observability";

const SUBSCRIPTION_BASE_CENTS = 4900; // $49/month base subscription

export type CommissionRunResult = {
  partnersProcessed: number;
  rowsUpserted: number;
  errors: number;
};

function previousFullMonthBounds(now: Date): {
  startMs: number;
  endMs: number;
} {
  // Always cover the most recent fully-closed calendar month so reruns are
  // idempotent and the period can't shift mid-month.
  const startOfThisMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const endMs = startOfThisMonth.getTime();
  const startOfPrevMonth = new Date(
    Date.UTC(startOfThisMonth.getUTCFullYear(), startOfThisMonth.getUTCMonth() - 1, 1),
  );
  return { startMs: startOfPrevMonth.getTime(), endMs };
}

function listAllPartnerIds(): number[] {
  // Pull distinct partner_id from referrals table — partners with zero
  // referrals don't generate commissions, so this is a tight scan.
  const rows = getDb()
    .selectDistinct({ partnerId: partnerReferrals.partnerId })
    .from(partnerReferrals)
    .all();
  return rows.map((r) => r.partnerId);
}

export async function runPartnerCommissionRun(opts?: {
  asOf?: Date;
}): Promise<CommissionRunResult> {
  const asOf = opts?.asOf ?? new Date();
  const { startMs, endMs } = previousFullMonthBounds(asOf);
  const result: CommissionRunResult = {
    partnersProcessed: 0,
    rowsUpserted: 0,
    errors: 0,
  };

  const partnerIds = listAllPartnerIds();
  for (const partnerId of partnerIds) {
    try {
      const partner = findPartnerById(partnerId);
      if (!partner || partner.status !== "active") continue;
      result.partnersProcessed++;
      const bps = partner.commissionPercentBps;
      const referrals = listReferralsForPartner(partner.id);
      for (const ref of referrals) {
        // Skip if attribution happened after the period ended — we don't
        // owe a commission for activity before they were attributed.
        if (ref.attributedAt >= endMs) continue;
        // Skip if churn happened before the period started.
        if (ref.churnedAt && ref.churnedAt < startMs) continue;

        const sub = getSubscriptionByOrgId(ref.organizationId);
        if (!sub) continue;
        const wasActive = isActive(sub);

        // 1) Subscription commission: only when the customer was on a paid
        //    plan at any point during the period. Best-effort: we credit if
        //    the subscription is currently active OR was active and ended
        //    during the period (currentPeriodEnd inside window).
        const subInWindow =
          wasActive ||
          (sub.currentPeriodEnd != null &&
            sub.currentPeriodEnd >= startMs &&
            sub.currentPeriodEnd < endMs);
        if (subInWindow) {
          const basis = SUBSCRIPTION_BASE_CENTS;
          const commission = Math.floor((basis * bps) / 10000);
          if (commission > 0) {
            upsertCommission({
              partnerId: partner.id,
              organizationId: ref.organizationId,
              periodStart: startMs,
              periodEnd: endMs,
              source: "subscription",
              basisCents: basis,
              commissionCents: commission,
            });
            result.rowsUpserted++;
          }
        }

        // 2) Platform-fee commission: 20% of the 1.9% application fees we
        //    collected in the period.
        const fees = sumPlatformFeesInPeriod(
          ref.organizationId,
          startMs,
          endMs,
        );
        if (fees > 0) {
          const commission = Math.floor((fees * bps) / 10000);
          if (commission > 0) {
            upsertCommission({
              partnerId: partner.id,
              organizationId: ref.organizationId,
              periodStart: startMs,
              periodEnd: endMs,
              source: "platform_fee",
              basisCents: fees,
              commissionCents: commission,
            });
            result.rowsUpserted++;
          }
        }
      }
    } catch (err) {
      result.errors++;
      captureException(err, {
        where: "partners.commission_run",
        partnerId,
      });
    }
  }
  return result;
}
