import "server-only";
import { upsertCustomerMetadata } from "../db/customerMetadata";
import type { Customer } from "@/lib/types";

const VIP_TAG = "VIP";

/**
 * Auto-tag the top 10% of customers (by trailing-12mo revenue, falling back
 * to amountOwed × 4) with the VIP tag. Customers no longer in the top tier
 * keep any existing VIP tag — we never remove tags the owner may have set
 * manually. Returns the list of customer ids that got the tag in this run.
 */
export function autoTagVips(
  orgId: number,
  customers: Customer[],
  existingTagsByCustomer: Map<string, string[]>,
): { tagged: string[] } {
  const ranked = customers
    .map((c) => ({
      id: c.id,
      name: c.name,
      revenue:
        c.annualRevenueCents ??
        Math.max(c.amountOwed * 4, 200_000),
    }))
    .sort((a, b) => b.revenue - a.revenue);
  const cutoff = Math.max(1, Math.ceil(ranked.length * 0.1));
  const topIds = new Set(ranked.slice(0, cutoff).map((r) => r.id));
  const tagged: string[] = [];

  for (const id of topIds) {
    const existing = existingTagsByCustomer.get(id) ?? [];
    if (existing.includes(VIP_TAG)) continue;
    const c = customers.find((x) => x.id === id);
    if (!c) continue;
    upsertCustomerMetadata({
      organizationId: orgId,
      customerId: id,
      tags: [...existing, VIP_TAG],
    });
    tagged.push(id);
  }
  return { tagged };
}
