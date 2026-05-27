import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "./client";
import { autopayMethods } from "./schema";

export type AutopayMethod = {
  organizationId: number;
  customerId: string;
  customerEmail: string;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  brand: string | null;
  last4: string | null;
  enrolledAt: number;
  paused: number;
  updatedAt: number;
};

export function getAutopayMethod(
  orgId: number,
  customerId: string,
): AutopayMethod | null {
  const db = getDb();
  return (
    (db
      .select()
      .from(autopayMethods)
      .where(
        and(
          eq(autopayMethods.organizationId, orgId),
          eq(autopayMethods.customerId, customerId),
        ),
      )
      .get() ?? null) as AutopayMethod | null
  );
}

export function listAutopayMethods(orgId: number): AutopayMethod[] {
  const db = getDb();
  return db
    .select()
    .from(autopayMethods)
    .where(eq(autopayMethods.organizationId, orgId))
    .all() as unknown as AutopayMethod[];
}

export function saveAutopayMethod(input: {
  organizationId: number;
  customerId: string;
  customerEmail: string;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  brand?: string | null;
  last4?: string | null;
}): AutopayMethod {
  const db = getDb();
  const now = Date.now();
  db.insert(autopayMethods)
    .values({
      organizationId: input.organizationId,
      customerId: input.customerId,
      customerEmail: input.customerEmail.toLowerCase(),
      stripeCustomerId: input.stripeCustomerId,
      stripePaymentMethodId: input.stripePaymentMethodId,
      brand: input.brand ?? null,
      last4: input.last4 ?? null,
      enrolledAt: now,
      paused: 0,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [autopayMethods.organizationId, autopayMethods.customerId],
      set: {
        customerEmail: input.customerEmail.toLowerCase(),
        stripeCustomerId: input.stripeCustomerId,
        stripePaymentMethodId: input.stripePaymentMethodId,
        brand: input.brand ?? null,
        last4: input.last4 ?? null,
        paused: 0,
        updatedAt: now,
      },
    })
    .run();
  return getAutopayMethod(input.organizationId, input.customerId)!;
}

export function setAutopayPaused(
  orgId: number,
  customerId: string,
  paused: boolean,
): void {
  const db = getDb();
  db.update(autopayMethods)
    .set({ paused: paused ? 1 : 0, updatedAt: Date.now() })
    .where(
      and(
        eq(autopayMethods.organizationId, orgId),
        eq(autopayMethods.customerId, customerId),
      ),
    )
    .run();
}

export function removeAutopayMethod(orgId: number, customerId: string): void {
  const db = getDb();
  db.delete(autopayMethods)
    .where(
      and(
        eq(autopayMethods.organizationId, orgId),
        eq(autopayMethods.customerId, customerId),
      ),
    )
    .run();
}
