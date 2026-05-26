"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth/session";
import { logAuditEvent } from "@/lib/server/db/auditEvents";
import {
  findOrgByPortalSlug,
  setOrgDepositConfig,
  setOrgDigestPhone,
  setOrgFlag,
  setOrgLogoUrl,
  setOrgPortalBranding,
  setOrgQboAccounts,
  setOrgTwilioPhone,
} from "@/lib/server/db/organizations";
import { upsertA2pRegistration } from "@/lib/server/db/a2p";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { provisionNumberForOrg } from "@/lib/server/twilio/provision";

export type OrgUpdateResult =
  | { ok: true }
  | { ok: false; error: string };

export async function setAutopilotEnabled(
  enabled: boolean,
): Promise<OrgUpdateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  setOrgFlag(user.organizationId!, "autopilotEnabled", enabled);
  logAuditEvent({
    organizationId: user.organizationId!,
    userId: user.id,
    actorEmail: user.email,
    kind: "settings.autopilot_toggled",
    metadata: { enabled },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function setDepositEnabled(
  enabled: boolean,
): Promise<OrgUpdateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  setOrgFlag(user.organizationId!, "depositEnabled", enabled);
  logAuditEvent({
    organizationId: user.organizationId!,
    userId: user.id,
    actorEmail: user.email,
    kind: "settings.deposit_toggled",
    metadata: { enabled },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function setReminderSequencesEnabled(
  enabled: boolean,
): Promise<OrgUpdateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  setOrgFlag(user.organizationId!, "reminderSequencesEnabled", enabled);
  logAuditEvent({
    organizationId: user.organizationId!,
    userId: user.id,
    actorEmail: user.email,
    kind: "settings.reminder_sequences_toggled",
    metadata: { enabled },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function setCustomReceiptsEnabled(
  enabled: boolean,
): Promise<OrgUpdateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  setOrgFlag(user.organizationId!, "customReceiptsEnabled", enabled);
  logAuditEvent({
    organizationId: user.organizationId!,
    userId: user.id,
    actorEmail: user.email,
    kind: "settings.custom_receipts_toggled",
    metadata: { enabled },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function savePortalBranding(input: {
  slug: string;
  accentColor: string;
  logoUrl?: string;
}): Promise<OrgUpdateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  const slug = input.slug.trim().toLowerCase();
  if (slug.length > 0 && !/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) {
    return { ok: false, error: "invalid_slug" };
  }
  if (slug.length > 0) {
    const existing = findOrgByPortalSlug(slug);
    if (existing && existing.id !== user.organizationId) {
      return { ok: false, error: "slug_taken" };
    }
  }
  const color = input.accentColor.trim();
  if (color.length > 0 && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { ok: false, error: "invalid_color" };
  }
  const logo = (input.logoUrl ?? "").trim();
  if (logo.length > 0) {
    if (logo.length > 500 || !/^https:\/\/[^\s]+$/i.test(logo)) {
      return { ok: false, error: "invalid_logo_url" };
    }
  }
  setOrgPortalBranding(user.organizationId!, {
    portalSlug: slug.length === 0 ? null : slug,
    portalAccentColor: color.length === 0 ? null : color,
  });
  setOrgLogoUrl(user.organizationId!, logo.length === 0 ? null : logo);
  revalidatePath("/settings");
  return { ok: true };
}

export async function saveQboRefundAccounts(input: {
  depositToAccountId: string;
  refundItemId: string;
}): Promise<OrgUpdateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  const depositToId = input.depositToAccountId.trim() || null;
  const itemId = input.refundItemId.trim() || null;
  setOrgQboAccounts(user.organizationId!, {
    qboDepositToAccountId: depositToId,
    qboRefundItemId: itemId,
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function saveDepositConfig(input: {
  percentBps: number;
  thresholdScore: number;
}): Promise<OrgUpdateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  const pct = Math.max(0, Math.min(10000, Math.round(input.percentBps)));
  const threshold = Math.max(
    300,
    Math.min(850, Math.round(input.thresholdScore)),
  );
  setOrgDepositConfig(user.organizationId!, {
    depositPercentBps: pct,
    depositThresholdScore: threshold,
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function saveDigestPhone(
  phone: string,
): Promise<OrgUpdateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  const trimmed = phone.trim();
  setOrgDigestPhone(user.organizationId!, trimmed.length === 0 ? null : trimmed);
  revalidatePath("/settings");
  return { ok: true };
}

export async function saveTwilioPhone(
  phone: string,
): Promise<OrgUpdateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  const trimmed = phone.trim();
  if (trimmed.length > 0 && !/^\+\d{6,15}$/.test(trimmed)) {
    return { ok: false, error: "invalid_phone" };
  }
  setOrgTwilioPhone(
    user.organizationId!,
    trimmed.length === 0 ? null : trimmed,
  );
  revalidatePath("/settings");
  return { ok: true };
}

export async function saveA2pRegistration(input: {
  legalBusinessName: string;
  businessEin: string;
  brandId: string;
  campaignId: string;
  brandStatus: string;
  campaignStatus: string;
}): Promise<OrgUpdateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  const allowed = new Set([
    "not_started",
    "submitted",
    "in_review",
    "approved",
    "rejected",
  ]);
  if (
    !allowed.has(input.brandStatus) ||
    !allowed.has(input.campaignStatus)
  ) {
    return { ok: false, error: "invalid_status" };
  }
  upsertA2pRegistration({
    organizationId: user.organizationId!,
    legalBusinessName: input.legalBusinessName.trim() || null,
    businessEin: input.businessEin.trim() || null,
    brandId: input.brandId.trim() || null,
    campaignId: input.campaignId.trim() || null,
    brandStatus: input.brandStatus as
      | "not_started"
      | "submitted"
      | "in_review"
      | "approved"
      | "rejected",
    campaignStatus: input.campaignStatus as
      | "not_started"
      | "submitted"
      | "in_review"
      | "approved"
      | "rejected",
  });
  revalidatePath("/settings");
  return { ok: true };
}

export type TwilioProvisionResult =
  | { ok: true; phoneNumber: string }
  | { ok: false; error: string };

export async function provisionTwilioNumber(
  areaCode?: string,
): Promise<TwilioProvisionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  const orgId = user.organizationId!;
  // Only orgs with active subscriptions get a number — keeps the platform
  // from getting billed for free signups.
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    return { ok: false, error: "no_active_subscription" };
  }
  const trimmed = areaCode?.trim();
  if (trimmed && !/^\d{3}$/.test(trimmed)) {
    return { ok: false, error: "invalid_area_code" };
  }
  const result = await provisionNumberForOrg({
    organizationId: orgId,
    areaCode: trimmed,
  });
  revalidatePath("/settings");
  return result;
}
