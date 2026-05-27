import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { subscriptions, type SubscriptionRow } from "./schema";

export function getSubscriptionByOrgId(
  organizationId: number,
): SubscriptionRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .get();
  return row ?? null;
}

export function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string,
): SubscriptionRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
    .get();
  return row ?? null;
}

export type SubscriptionUpsert = {
  organizationId: number;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  status?: string | null;
  currentPeriodEnd?: number | null;
  cancelAtPeriodEnd?: boolean;
};

export function upsertSubscription(input: SubscriptionUpsert): void {
  const db = getDb();
  const now = Date.now();
  db.insert(subscriptions)
    .values({
      organizationId: input.organizationId,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      status: input.status ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: subscriptions.organizationId,
      set: {
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
        status: input.status ?? null,
        currentPeriodEnd: input.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd ? 1 : 0,
        updatedAt: now,
      },
    })
    .run();
}

export function isActive(sub: SubscriptionRow | null): boolean {
  // Demo / staging bypass: when running with mock data, everyone is
  // implicitly subscribed so the billing gate doesn't lock the app.
  if (process.env.USE_MOCK_DATA === "1") return true;
  if (!sub || !sub.status) return false;
  return sub.status === "active" || sub.status === "trialing";
}
