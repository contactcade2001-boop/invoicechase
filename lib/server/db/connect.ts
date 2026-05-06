import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import {
  stripeConnectAccounts,
  type StripeConnectAccountRow,
} from "./schema";

export function getConnectAccount(
  organizationId: number,
): StripeConnectAccountRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(stripeConnectAccounts)
    .where(eq(stripeConnectAccounts.organizationId, organizationId))
    .get();
  return row ?? null;
}

export function getConnectAccountByStripeId(
  stripeAccountId: string,
): StripeConnectAccountRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(stripeConnectAccounts)
    .where(eq(stripeConnectAccounts.stripeAccountId, stripeAccountId))
    .get();
  return row ?? null;
}

export type ConnectAccountUpsert = {
  organizationId: number;
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

export function upsertConnectAccount(input: ConnectAccountUpsert): void {
  const db = getDb();
  const now = Date.now();
  db.insert(stripeConnectAccounts)
    .values({
      organizationId: input.organizationId,
      stripeAccountId: input.stripeAccountId,
      chargesEnabled: input.chargesEnabled ? 1 : 0,
      payoutsEnabled: input.payoutsEnabled ? 1 : 0,
      detailsSubmitted: input.detailsSubmitted ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: stripeConnectAccounts.organizationId,
      set: {
        stripeAccountId: input.stripeAccountId,
        chargesEnabled: input.chargesEnabled ? 1 : 0,
        payoutsEnabled: input.payoutsEnabled ? 1 : 0,
        detailsSubmitted: input.detailsSubmitted ? 1 : 0,
        updatedAt: now,
      },
    })
    .run();
}

export function canAcceptPayments(
  account: StripeConnectAccountRow | null,
): boolean {
  return !!account && account.chargesEnabled === 1;
}
