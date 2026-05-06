"use server";

import { getCurrentUser } from "@/lib/server/auth/session";
import {
  getSubscriptionByUserId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { getDashboardData } from "@/lib/server/qbo/sync";
import { sendInvoiceSms } from "@/lib/server/twilio/sms";
import type { Customer } from "@/lib/types";

export type SmsResult =
  | { ok: true; sentCount: number; failedCount: number }
  | { ok: false; error: string };

async function loadCustomers(): Promise<Customer[] | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "not_signed_in" };
  if (!isActive(getSubscriptionByUserId(user.id))) {
    return { error: "no_active_subscription" };
  }
  const data = await getDashboardData(user.id);
  if (!data.connected) return { error: "not_connected" };
  return data.customers;
}

export async function sendTextToCustomer(
  customerId: string,
): Promise<SmsResult> {
  const customers = await loadCustomers();
  if ("error" in customers) return { ok: false, error: customers.error };
  const customer = customers.find((c) => c.id === customerId);
  if (!customer) return { ok: false, error: "customer_not_found" };
  if (!customer.phone) return { ok: false, error: "no_phone" };
  try {
    await sendInvoiceSms(customer);
    return { ok: true, sentCount: 1, failedCount: 0 };
  } catch (err) {
    console.error("[sms] send failed", err);
    return { ok: false, error: "send_failed" };
  }
}

export async function bulkTextOverdue(): Promise<SmsResult> {
  const customers = await loadCustomers();
  if ("error" in customers) return { ok: false, error: customers.error };
  const overdue = customers.filter((c) => c.daysLate > 0 && c.phone);
  if (overdue.length === 0) {
    return { ok: false, error: "no_overdue_with_phone" };
  }
  const results = await Promise.allSettled(
    overdue.map((c) => sendInvoiceSms(c)),
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
