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
