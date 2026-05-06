"use server";

import { getCurrentUser } from "@/lib/server/auth/session";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import type { UserRow } from "@/lib/server/db/schema";
import { setSmsTemplate } from "@/lib/server/db/users";
import {
  appendMessage,
  getOrCreateConversation,
} from "@/lib/server/db/sms";
import { getOrCreatePayLink } from "@/lib/server/pay/links";
import { getDashboardData } from "@/lib/server/qbo/sync";
import { LIMITS, checkRateLimit } from "@/lib/server/rateLimit";
import { renderSmsBody } from "@/lib/smsTemplate";
import { sendInvoiceSms } from "@/lib/server/twilio/sms";
import type { Customer } from "@/lib/types";

export type SmsResult =
  | { ok: true; sentCount: number; failedCount: number }
  | { ok: false; error: string };

type Loaded = {
  user: UserRow;
  organizationId: number;
  customers: Customer[];
  businessName: string;
};

async function loadCustomers(): Promise<Loaded | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "not_signed_in" };
  const orgId = user.organizationId;
  if (!orgId) return { error: "no_organization" };
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    return { error: "no_active_subscription" };
  }
  const data = await getDashboardData(orgId);
  if (!data.connected) return { error: "not_connected" };
  return {
    user,
    organizationId: orgId,
    customers: data.customers,
    businessName: data.companyName,
  };
}

async function sendOne(
  loaded: Loaded,
  customer: Customer,
): Promise<void> {
  const { url } = getOrCreatePayLink(loaded.organizationId, customer.id);
  await sendInvoiceSms(customer, {
    template: loaded.user.smsTemplate,
    businessName: loaded.businessName,
    payUrl: url,
  });
  if (customer.phone) {
    const conv = getOrCreateConversation({
      organizationId: loaded.organizationId,
      customerPhone: customer.phone,
      customerId: customer.id,
      customerName: customer.name,
    });
    appendMessage({
      conversationId: conv.id,
      direction: "outbound",
      body: renderSmsBody(loaded.user.smsTemplate, {
        amountCents: customer.amountOwed,
        payUrl: url,
        customerName: customer.name,
        businessName: loaded.businessName,
      }),
    });
  }
}

export async function sendTextToCustomer(
  customerId: string,
): Promise<SmsResult> {
  const loaded = await loadCustomers();
  if ("error" in loaded) return { ok: false, error: loaded.error };
  const minute = checkRateLimit(
    `sms:min:${loaded.organizationId}`,
    LIMITS.smsPerMinute.max,
    LIMITS.smsPerMinute.windowMs,
  );
  if (!minute.allowed) return { ok: false, error: "rate_limited" };
  const hour = checkRateLimit(
    `sms:hr:${loaded.organizationId}`,
    LIMITS.smsPerHour.max,
    LIMITS.smsPerHour.windowMs,
  );
  if (!hour.allowed) return { ok: false, error: "rate_limited" };

  const customer = loaded.customers.find((c) => c.id === customerId);
  if (!customer) return { ok: false, error: "customer_not_found" };
  if (!customer.phone) return { ok: false, error: "no_phone" };
  try {
    await sendOne(loaded, customer);
    return { ok: true, sentCount: 1, failedCount: 0 };
  } catch (err) {
    console.error("[sms] send failed", err);
    return { ok: false, error: "send_failed" };
  }
}

export async function bulkTextOverdue(): Promise<SmsResult> {
  const loaded = await loadCustomers();
  if ("error" in loaded) return { ok: false, error: loaded.error };
  if (loaded.user.role === "technician") {
    return { ok: false, error: "forbidden" };
  }
  const bulk = checkRateLimit(
    `sms:bulk:${loaded.organizationId}`,
    LIMITS.bulkSmsPerMinute.max,
    LIMITS.bulkSmsPerMinute.windowMs,
  );
  if (!bulk.allowed) return { ok: false, error: "rate_limited" };
  const overdue = loaded.customers.filter(
    (c) => c.daysLate > 0 && c.phone,
  );
  if (overdue.length === 0) {
    return { ok: false, error: "no_overdue_with_phone" };
  }
  const results = await Promise.allSettled(
    overdue.map((c) => sendOne(loaded, c)),
  );
  let sent = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === "fulfilled") sent++;
    else {
      failed++;
      console.error("[sms] bulk item failed", r.reason);
    }
  }
  return { ok: true, sentCount: sent, failedCount: failed };
}

export async function saveSmsTemplate(
  template: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role === "technician") {
    return { ok: false, error: "forbidden" };
  }
  const trimmed = template.trim();
  if (trimmed.length > 320) {
    return { ok: false, error: "too_long" };
  }
  setSmsTemplate(user.id, trimmed.length === 0 ? null : trimmed);
  return { ok: true };
}
