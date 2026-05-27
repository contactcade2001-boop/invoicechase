import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "./client";
import { settlementOffers } from "./schema";

export type SettlementOffer = {
  id: number;
  organizationId: number;
  customerId: string;
  customerName: string | null;
  originalBalanceCents: number;
  offerBalanceCents: number;
  expiresInHours: number;
  expiresAt: number;
  status: string;
  acceptedAt: number | null;
  declinedAt: number | null;
  paidAt: number | null;
  payLinkId: number | null;
  createdAt: number;
};

export function listOpenOffers(orgId: number): SettlementOffer[] {
  const db = getDb();
  return db
    .select()
    .from(settlementOffers)
    .where(
      and(
        eq(settlementOffers.organizationId, orgId),
        isNull(settlementOffers.paidAt),
      ),
    )
    .all() as unknown as SettlementOffer[];
}

export function createSettlementOffer(input: {
  organizationId: number;
  customerId: string;
  customerName?: string | null;
  originalBalanceCents: number;
  discountBps: number;
  expiresInHours?: number;
}): SettlementOffer {
  const db = getDb();
  const expiresInHours = input.expiresInHours ?? 48;
  const offerCents = Math.floor(
    input.originalBalanceCents * (1 - input.discountBps / 10_000),
  );
  const now = Date.now();
  const row = db
    .insert(settlementOffers)
    .values({
      organizationId: input.organizationId,
      customerId: input.customerId,
      customerName: input.customerName ?? null,
      originalBalanceCents: input.originalBalanceCents,
      offerBalanceCents: offerCents,
      expiresInHours,
      expiresAt: now + expiresInHours * 60 * 60 * 1000,
      createdAt: now,
    })
    .returning()
    .get();
  return row as unknown as SettlementOffer;
}

export function markOfferStatus(
  orgId: number,
  id: number,
  status: "accepted" | "declined" | "paid",
): void {
  const db = getDb();
  const ts = Date.now();
  const set: Record<string, unknown> = { status };
  if (status === "accepted") set.acceptedAt = ts;
  if (status === "declined") set.declinedAt = ts;
  if (status === "paid") set.paidAt = ts;
  db.update(settlementOffers)
    .set(set)
    .where(
      and(
        eq(settlementOffers.organizationId, orgId),
        eq(settlementOffers.id, id),
      ),
    )
    .run();
}
