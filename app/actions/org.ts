"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  setOrgDepositConfig,
  setOrgDigestPhone,
  setOrgFlag,
} from "@/lib/server/db/organizations";

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
