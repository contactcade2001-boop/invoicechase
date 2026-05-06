"use server";

import { getCurrentUser } from "@/lib/server/auth/session";
import {
  getSubscriptionByUserId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { getOrCreatePayLink } from "@/lib/server/pay/links";
import { getDashboardData } from "@/lib/server/qbo/sync";

export type PayLinkActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function getPayLinkUrl(
  customerId: string,
): Promise<PayLinkActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (!isActive(getSubscriptionByUserId(user.id))) {
    return { ok: false, error: "no_active_subscription" };
  }
  const data = await getDashboardData(user.id);
  if (!data.connected) return { ok: false, error: "not_connected" };
  const customer = data.customers.find((c) => c.id === customerId);
  if (!customer) return { ok: false, error: "customer_not_found" };

  const { url } = getOrCreatePayLink(user.id, customerId);
  return { ok: true, url };
}
