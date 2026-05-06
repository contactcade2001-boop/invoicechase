"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth/session";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import {
  createPartner,
  findCommissionById,
  findPartnerById,
  findPartnerByUserId,
  markCommissionPaid,
  markCommissionTransferred,
  markWelcomeEmailSent,
} from "@/lib/server/db/partners";
import { sendPartnerWelcomeEmail } from "@/lib/server/email/partner";
import { generateUniqueReferralCode } from "@/lib/server/partners/code";
import { LIMITS, checkRateLimit } from "@/lib/server/rateLimit";
import {
  createPartnerOnboardingLink,
  transferCommissionCents,
} from "@/lib/server/stripe/partnerConnect";

export type PartnerSignupResult =
  | { ok: true; referralCode: string }
  | { ok: false; error: string };

export async function applyAsPartner(input: {
  displayName: string;
  companyName: string;
  payoutEmail: string;
}): Promise<PartnerSignupResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  // Throttle so a wedged form can't spawn a row per click.
  const limit = checkRateLimit(
    `partner-apply:${user.id}`,
    LIMITS.magicLinkPerHour.max,
    LIMITS.magicLinkPerHour.windowMs,
  );
  if (!limit.allowed) return { ok: false, error: "rate_limited" };

  const existing = findPartnerByUserId(user.id);
  if (existing) {
    return { ok: true, referralCode: existing.referralCode };
  }

  const displayName = input.displayName.trim().slice(0, 120);
  const companyName = input.companyName.trim().slice(0, 160);
  const payoutEmail = input.payoutEmail.trim().toLowerCase().slice(0, 200);

  if (!displayName) return { ok: false, error: "missing_name" };
  if (!payoutEmail.includes("@")) {
    return { ok: false, error: "invalid_payout_email" };
  }

  const code = generateUniqueReferralCode();
  const partner = createPartner({
    userId: user.id,
    email: user.email,
    displayName,
    companyName: companyName || null,
    referralCode: code,
    payoutEmail,
  });

  // Fire-and-forget welcome email; failures don't block the response.
  void (async () => {
    try {
      await sendPartnerWelcomeEmail({
        to: payoutEmail || user.email,
        displayName,
        referralCode: partner.referralCode,
      });
      markWelcomeEmailSent(partner.id);
    } catch (err) {
      console.error("[partner] welcome email failed", err);
    }
  })();

  revalidatePath("/partner");
  return { ok: true, referralCode: partner.referralCode };
}

export type MarkPaidResult = { ok: true } | { ok: false; error: string };

export async function markPartnerCommissionPaid(input: {
  commissionId: number;
  payoutReference: string;
}): Promise<MarkPaidResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  // Self-service: a partner marks their own row paid (e.g., once they've
  // received an off-platform payout). Limit to their own partner record.
  const partner = findPartnerByUserId(user.id);
  if (!partner) return { ok: false, error: "not_a_partner" };
  const commission = findCommissionById(input.commissionId);
  if (!commission || commission.partnerId !== partner.id) {
    return { ok: false, error: "not_found" };
  }
  // Self-acknowledged off-platform payout. Use the Stripe transfer flow for
  // a fully-automated path.
  markCommissionPaid(
    input.commissionId,
    input.payoutReference.trim().slice(0, 200) || null,
  );
  revalidatePath("/partner");
  return { ok: true };
}

export type PartnerOnboardResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function startPartnerStripeOnboarding(): Promise<PartnerOnboardResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  const partner = findPartnerByUserId(user.id);
  if (!partner) return { ok: false, error: "not_a_partner" };
  try {
    const url = await createPartnerOnboardingLink(partner.id);
    logAuditEvent({
      organizationId: 0,
      userId: user.id,
      actorEmail: user.email,
      kind: "partner.connect_started",
      targetType: "partner",
      targetId: String(partner.id),
    });
    return { ok: true, url };
  } catch (err) {
    console.error("[partner] connect onboarding failed", err);
    return { ok: false, error: "stripe_failed" };
  }
}

export type TransferResult =
  | { ok: true; transferId: string }
  | { ok: false; error: string };

export async function transferPartnerCommission(
  commissionId: number,
): Promise<TransferResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  const partner = findPartnerByUserId(user.id);
  if (!partner) return { ok: false, error: "not_a_partner" };
  if (!partner.stripeAccountId) {
    return { ok: false, error: "stripe_not_connected" };
  }
  const commission = findCommissionById(commissionId);
  if (!commission || commission.partnerId !== partner.id) {
    return { ok: false, error: "not_found" };
  }
  if (commission.status !== "pending") {
    return { ok: false, error: "already_paid" };
  }
  if (commission.commissionCents <= 0) {
    return { ok: false, error: "zero_amount" };
  }
  try {
    const transfer = await transferCommissionCents({
      stripeAccountId: partner.stripeAccountId,
      amountCents: commission.commissionCents,
      metadata: {
        partnerId: String(partner.id),
        commissionId: String(commission.id),
        organizationId: String(commission.organizationId),
        periodStart: String(commission.periodStart),
      },
    });
    markCommissionTransferred(commission.id, transfer.id);
    logAuditEvent({
      organizationId: commission.organizationId,
      userId: user.id,
      actorEmail: user.email,
      kind: "partner.payout_transferred",
      targetType: "partner_commission",
      targetId: String(commission.id),
      metadata: {
        amountCents: commission.commissionCents,
        transferId: transfer.id,
      },
    });
    revalidatePath("/partner");
    return { ok: true, transferId: transfer.id };
  } catch (err) {
    console.error("[partner] transfer failed", err);
    return { ok: false, error: "transfer_failed" };
  }
}

void findPartnerById; // re-exported elsewhere; keep import alive for type narrowing
