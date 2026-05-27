import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { organizations } from "../db/schema";
import { decryptToken, encryptToken } from "../crypto";

export type PlaidConnection = {
  itemId: string;
  accessToken: string;
  institutionName: string | null;
  bankBalanceCents: number | null;
  bankBalanceRefreshedAt: number | null;
};

export function getPlaidConnection(orgId: number): PlaidConnection | null {
  const db = getDb();
  const o = db
    .select({
      plaidItemId: organizations.plaidItemId,
      plaidAccessTokenEnc: organizations.plaidAccessTokenEnc,
      plaidInstitutionName: organizations.plaidInstitutionName,
      bankBalanceCents: organizations.bankBalanceCents,
      bankBalanceRefreshedAt: organizations.bankBalanceRefreshedAt,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .get();
  if (!o?.plaidItemId || !o.plaidAccessTokenEnc) return null;
  return {
    itemId: o.plaidItemId,
    accessToken: decryptToken(o.plaidAccessTokenEnc),
    institutionName: o.plaidInstitutionName ?? null,
    bankBalanceCents: o.bankBalanceCents ?? null,
    bankBalanceRefreshedAt: o.bankBalanceRefreshedAt ?? null,
  };
}

export function savePlaidConnection(
  orgId: number,
  input: {
    itemId: string;
    accessToken: string;
    institutionName: string | null;
  },
): void {
  const db = getDb();
  db.update(organizations)
    .set({
      plaidItemId: input.itemId,
      plaidAccessTokenEnc: encryptToken(input.accessToken),
      plaidInstitutionName: input.institutionName,
      updatedAt: Date.now(),
    })
    .where(eq(organizations.id, orgId))
    .run();
}

export function clearPlaidConnection(orgId: number): void {
  const db = getDb();
  db.update(organizations)
    .set({
      plaidItemId: null,
      plaidAccessTokenEnc: null,
      plaidInstitutionName: null,
      bankBalanceCents: null,
      bankBalanceRefreshedAt: null,
      updatedAt: Date.now(),
    })
    .where(eq(organizations.id, orgId))
    .run();
}

export function setBankBalance(orgId: number, cents: number): void {
  const db = getDb();
  db.update(organizations)
    .set({
      bankBalanceCents: cents,
      bankBalanceRefreshedAt: Date.now(),
      updatedAt: Date.now(),
    })
    .where(eq(organizations.id, orgId))
    .run();
}
