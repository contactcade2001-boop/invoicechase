"use server";

import { getCurrentUser } from "@/lib/server/auth/session";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { getOrCreatePayLink } from "@/lib/server/pay/links";
import { getDashboardData } from "@/lib/server/qbo/sync";
import { LIMITS, checkRateLimit } from "@/lib/server/rateLimit";

export type PayLinkActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function getPayLinkUrl(
  customerId: string,
): Promise<PayLinkActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  const orgId = user.organizationId;
  if (!orgId) return { ok: false, error: "no_organization" };
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    return { ok: false, error: "no_active_subscription" };
  }
  const limit = checkRateLimit(
    `pay-link:${orgId}`,
    LIMITS.payLinkPerMinute.max,
    LIMITS.payLinkPerMinute.windowMs,
  );
  if (!limit.allowed) return { ok: false, error: "rate_limited" };

  const data = await getDashboardData(orgId);
  if (!data.connected) return { ok: false, error: "not_connected" };
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return { ok: false, error: "customer_not_found" };

  const { url } = getOrCreatePayLink(orgId, customerId);
  return { ok: true, url };
}
