import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "./client";
import {
  organizationInvites,
  organizations,
  users,
  type OrganizationInviteRow,
  type OrganizationRow,
  type UserRole,
  type UserRow,
} from "./schema";

export function createOrgForUser(user: UserRow): OrganizationRow {
  const db = getDb();
  const now = Date.now();
  const name = user.email.split("@")[0] || `Org ${user.id}`;
  const inserted = db
    .insert(organizations)
    .values({
      name,
      ownerUserId: user.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();
  db.update(users)
    .set({ organizationId: inserted.id, role: "owner", updatedAt: now })
    .where(eq(users.id, user.id))
    .run();
  return inserted;
}

export function getOrgById(id: number): OrganizationRow | null {
  const db = getDb();
  return (
    db.select().from(organizations).where(eq(organizations.id, id)).get() ??
    null
  );
}

export function listOrgsWithQboConnection(): OrganizationRow[] {
  const db = getDb();
  return db.select().from(organizations).all();
}

export function setOrgFlag(
  organizationId: number,
  field:
    | "autopilotEnabled"
    | "depositEnabled"
    | "customReceiptsEnabled",
  value: boolean,
): void {
  const db = getDb();
  db.update(organizations)
    .set({ [field]: value ? 1 : 0, updatedAt: Date.now() })
    .where(eq(organizations.id, organizationId))
    .run();
}

export function setOrgQboAccounts(
  organizationId: number,
  fields: {
    qboDepositToAccountId?: string | null;
    qboRefundAccountId?: string | null;
    qboRefundItemId?: string | null;
  },
): void {
  const db = getDb();
  const set: Record<string, unknown> = { updatedAt: Date.now() };
  if (fields.qboDepositToAccountId !== undefined) {
    set.qboDepositToAccountId = fields.qboDepositToAccountId;
  }
  if (fields.qboRefundAccountId !== undefined) {
    set.qboRefundAccountId = fields.qboRefundAccountId;
  }
  if (fields.qboRefundItemId !== undefined) {
    set.qboRefundItemId = fields.qboRefundItemId;
  }
  if (Object.keys(set).length === 1) return;
  db.update(organizations)
    .set(set)
    .where(eq(organizations.id, organizationId))
    .run();
}

export function setOrgDepositConfig(
  organizationId: number,
  fields: {
    depositPercentBps?: number;
    depositThresholdScore?: number;
  },
): void {
  const db = getDb();
  const set: Record<string, unknown> = { updatedAt: Date.now() };
  if (fields.depositPercentBps != null) {
    set.depositPercentBps = fields.depositPercentBps;
  }
  if (fields.depositThresholdScore != null) {
    set.depositThresholdScore = fields.depositThresholdScore;
  }
  if (Object.keys(set).length === 1) return;
  db.update(organizations)
    .set(set)
    .where(eq(organizations.id, organizationId))
    .run();
}

export function setOrgDigestPhone(
  organizationId: number,
  phone: string | null,
): void {
  const db = getDb();
  db.update(organizations)
    .set({ digestPhone: phone, updatedAt: Date.now() })
    .where(eq(organizations.id, organizationId))
    .run();
}

export function setOrgTwilioPhone(
  organizationId: number,
  phone: string | null,
): void {
  const db = getDb();
  db.update(organizations)
    .set({ twilioPhoneNumber: phone, updatedAt: Date.now() })
    .where(eq(organizations.id, organizationId))
    .run();
}

export function findOrgByTwilioPhone(
  phone: string,
): OrganizationRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(organizations)
    .where(eq(organizations.twilioPhoneNumber, phone))
    .get();
  return row ?? null;
}

export function findOrgByPortalSlug(
  slug: string,
): OrganizationRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(organizations)
    .where(eq(organizations.portalSlug, slug))
    .get();
  return row ?? null;
}

export function setOrgPortalBranding(
  organizationId: number,
  fields: {
    portalSlug?: string | null;
    portalAccentColor?: string | null;
  },
): void {
  const db = getDb();
  const set: Record<string, unknown> = { updatedAt: Date.now() };
  if (fields.portalSlug !== undefined) set.portalSlug = fields.portalSlug;
  if (fields.portalAccentColor !== undefined) {
    set.portalAccentColor = fields.portalAccentColor;
  }
  if (Object.keys(set).length === 1) return;
  db.update(organizations)
    .set(set)
    .where(eq(organizations.id, organizationId))
    .run();
}

export function markDigestSent(organizationId: number): void {
  const db = getDb();
  db.update(organizations)
    .set({ lastDigestAt: Date.now(), updatedAt: Date.now() })
    .where(eq(organizations.id, organizationId))
    .run();
}

export function markDepositPolled(organizationId: number): void {
  const db = getDb();
  db.update(organizations)
    .set({ lastDepositPollAt: Date.now(), updatedAt: Date.now() })
    .where(eq(organizations.id, organizationId))
    .run();
}

export function getOrgForUser(user: UserRow): OrganizationRow | null {
  if (!user.organizationId) return null;
  return getOrgById(user.organizationId);
}

export function ensureOrgForUser(user: UserRow): OrganizationRow {
  const existing = getOrgForUser(user);
  if (existing) return existing;
  return createOrgForUser(user);
}

export function setOrgName(orgId: number, name: string): void {
  const db = getDb();
  db.update(organizations)
    .set({ name, updatedAt: Date.now() })
    .where(eq(organizations.id, orgId))
    .run();
}

export function listOrgMembers(orgId: number): UserRow[] {
  const db = getDb();
  return db
    .select()
    .from(users)
    .where(eq(users.organizationId, orgId))
    .all();
}

export function setUserRole(userId: number, role: UserRole): void {
  const db = getDb();
  db.update(users)
    .set({ role, updatedAt: Date.now() })
    .where(eq(users.id, userId))
    .run();
}

export function moveUserToOrg(
  userId: number,
  orgId: number,
  role: UserRole,
): void {
  const db = getDb();
  db.update(users)
    .set({ organizationId: orgId, role, updatedAt: Date.now() })
    .where(eq(users.id, userId))
    .run();
}

export function removeUserFromOrg(userId: number): void {
  // Demote them to a brand-new personal org so they keep their account but
  // lose access to the previous one.
  const db = getDb();
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return;
  const now = Date.now();
  const personal = db
    .insert(organizations)
    .values({
      name: user.email.split("@")[0] || `Org ${user.id}`,
      ownerUserId: user.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();
  db.update(users)
    .set({ organizationId: personal.id, role: "owner", updatedAt: now })
    .where(eq(users.id, userId))
    .run();
}

// ── Invites ───────────────────────────────────────────────────────────────

export function insertInvite(input: {
  organizationId: number;
  email: string;
  role: UserRole;
  tokenHash: string;
  expiresAt: number;
}): void {
  const db = getDb();
  db.insert(organizationInvites)
    .values({
      organizationId: input.organizationId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      createdAt: Date.now(),
    })
    .run();
}

export function findActiveInvite(
  tokenHash: string,
): OrganizationInviteRow | null {
  const db = getDb();
  const row = db
    .select()
    .from(organizationInvites)
    .where(
      and(
        eq(organizationInvites.tokenHash, tokenHash),
        isNull(organizationInvites.usedAt),
      ),
    )
    .get();
  return row ?? null;
}

export function markInviteUsed(id: number): void {
  const db = getDb();
  db.update(organizationInvites)
    .set({ usedAt: Date.now() })
    .where(eq(organizationInvites.id, id))
    .run();
}

export function listInvitesForOrg(
  orgId: number,
): OrganizationInviteRow[] {
  const db = getDb();
  return db
    .select()
    .from(organizationInvites)
    .where(
      and(
        eq(organizationInvites.organizationId, orgId),
        isNull(organizationInvites.usedAt),
      ),
    )
    .all();
}

export function deleteInvite(id: number, orgId: number): void {
  const db = getDb();
  db.delete(organizationInvites)
    .where(
      and(
        eq(organizationInvites.id, id),
        eq(organizationInvites.organizationId, orgId),
      ),
    )
    .run();
}
