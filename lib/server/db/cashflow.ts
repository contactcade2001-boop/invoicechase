import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { organizations } from "./schema";

export type CashflowConfig = {
  earlyPayDiscountBps: number;
  earlyPayDays: number;
  achDiscountBps: number;
  lateFeeBps: number;
  lateFeeStartDays: number;
  preDueReminderDays: number;
  smartSendTimesEnabled: boolean;
  bankBalanceCents: number | null;
  bankBalanceRefreshedAt: number | null;
  plaidConnected: boolean;
  seasonalPauseUntil: number | null;
  approvalQueueEnabled: boolean;
  thankYouOnPaymentEnabled: boolean;
  reviewRequestEnabled: boolean;
  reviewRequestUrl: string | null;
};

export function getCashflowConfig(orgId: number): CashflowConfig {
  const db = getDb();
  const o = db
    .select({
      earlyPayDiscountBps: organizations.earlyPayDiscountBps,
      earlyPayDays: organizations.earlyPayDays,
      achDiscountBps: organizations.achDiscountBps,
      lateFeeBps: organizations.lateFeeBps,
      lateFeeStartDays: organizations.lateFeeStartDays,
      preDueReminderDays: organizations.preDueReminderDays,
      smartSendTimesEnabled: organizations.smartSendTimesEnabled,
      bankBalanceCents: organizations.bankBalanceCents,
      bankBalanceRefreshedAt: organizations.bankBalanceRefreshedAt,
      plaidItemId: organizations.plaidItemId,
      seasonalPauseUntil: organizations.seasonalPauseUntil,
      approvalQueueEnabled: organizations.approvalQueueEnabled,
      thankYouOnPaymentEnabled: organizations.thankYouOnPaymentEnabled,
      reviewRequestEnabled: organizations.reviewRequestEnabled,
      reviewRequestUrl: organizations.reviewRequestUrl,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .get();
  return {
    earlyPayDiscountBps: o?.earlyPayDiscountBps ?? 0,
    earlyPayDays: o?.earlyPayDays ?? 7,
    achDiscountBps: o?.achDiscountBps ?? 0,
    lateFeeBps: o?.lateFeeBps ?? 0,
    lateFeeStartDays: o?.lateFeeStartDays ?? 30,
    preDueReminderDays: o?.preDueReminderDays ?? 0,
    smartSendTimesEnabled: (o?.smartSendTimesEnabled ?? 0) === 1,
    bankBalanceCents: o?.bankBalanceCents ?? null,
    bankBalanceRefreshedAt: o?.bankBalanceRefreshedAt ?? null,
    plaidConnected: !!o?.plaidItemId,
    seasonalPauseUntil: o?.seasonalPauseUntil ?? null,
    approvalQueueEnabled: (o?.approvalQueueEnabled ?? 0) === 1,
    thankYouOnPaymentEnabled: (o?.thankYouOnPaymentEnabled ?? 1) === 1,
    reviewRequestEnabled: (o?.reviewRequestEnabled ?? 0) === 1,
    reviewRequestUrl: o?.reviewRequestUrl ?? null,
  };
}

export function updateCashflowConfig(
  orgId: number,
  patch: Partial<{
    earlyPayDiscountBps: number;
    earlyPayDays: number;
    achDiscountBps: number;
    lateFeeBps: number;
    lateFeeStartDays: number;
    preDueReminderDays: number;
    smartSendTimesEnabled: boolean;
    bankBalanceCents: number | null;
    seasonalPauseUntil: number | null;
    approvalQueueEnabled: boolean;
    thankYouOnPaymentEnabled: boolean;
    reviewRequestEnabled: boolean;
    reviewRequestUrl: string | null;
  }>,
): void {
  const db = getDb();
  const update: Record<string, unknown> = { updatedAt: Date.now() };
  if (patch.earlyPayDiscountBps !== undefined)
    update.earlyPayDiscountBps = Math.max(0, Math.min(5000, patch.earlyPayDiscountBps));
  if (patch.earlyPayDays !== undefined)
    update.earlyPayDays = Math.max(1, Math.min(60, patch.earlyPayDays));
  if (patch.achDiscountBps !== undefined)
    update.achDiscountBps = Math.max(0, Math.min(5000, patch.achDiscountBps));
  if (patch.lateFeeBps !== undefined)
    update.lateFeeBps = Math.max(0, Math.min(5000, patch.lateFeeBps));
  if (patch.lateFeeStartDays !== undefined)
    update.lateFeeStartDays = Math.max(0, Math.min(180, patch.lateFeeStartDays));
  if (patch.preDueReminderDays !== undefined)
    update.preDueReminderDays = Math.max(0, Math.min(30, patch.preDueReminderDays));
  if (patch.smartSendTimesEnabled !== undefined)
    update.smartSendTimesEnabled = patch.smartSendTimesEnabled ? 1 : 0;
  if (patch.bankBalanceCents !== undefined) {
    update.bankBalanceCents = patch.bankBalanceCents;
    update.bankBalanceRefreshedAt = Date.now();
  }
  if (patch.seasonalPauseUntil !== undefined)
    update.seasonalPauseUntil = patch.seasonalPauseUntil;
  if (patch.approvalQueueEnabled !== undefined)
    update.approvalQueueEnabled = patch.approvalQueueEnabled ? 1 : 0;
  if (patch.thankYouOnPaymentEnabled !== undefined)
    update.thankYouOnPaymentEnabled = patch.thankYouOnPaymentEnabled ? 1 : 0;
  if (patch.reviewRequestEnabled !== undefined)
    update.reviewRequestEnabled = patch.reviewRequestEnabled ? 1 : 0;
  if (patch.reviewRequestUrl !== undefined)
    update.reviewRequestUrl = patch.reviewRequestUrl;
  db.update(organizations).set(update).where(eq(organizations.id, orgId)).run();
}

/** Compute the discounted amount after early-pay + ACH discount stacking. */
export function applyDiscounts(
  amountCents: number,
  cfg: { earlyPayDiscountBps: number; achDiscountBps: number },
  opts: { isEarly: boolean; isAch: boolean },
): { discountCents: number; finalCents: number } {
  let bps = 0;
  if (opts.isEarly) bps += cfg.earlyPayDiscountBps;
  if (opts.isAch) bps += cfg.achDiscountBps;
  const discountCents = Math.floor((amountCents * bps) / 10_000);
  return {
    discountCents,
    finalCents: Math.max(0, amountCents - discountCents),
  };
}

/** Compute the accrued late fee for an invoice this many days past due. */
export function computeLateFee(
  balanceCents: number,
  daysLate: number,
  cfg: { lateFeeBps: number; lateFeeStartDays: number },
): number {
  if (cfg.lateFeeBps <= 0) return 0;
  if (daysLate <= cfg.lateFeeStartDays) return 0;
  const monthsLate = (daysLate - cfg.lateFeeStartDays) / 30;
  const feeBps = cfg.lateFeeBps * monthsLate;
  return Math.floor((balanceCents * feeBps) / 10_000);
}
