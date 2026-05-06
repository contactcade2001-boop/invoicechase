import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { users, type UserRow } from "./schema";

export function findUserByEmail(email: string): UserRow | null {
  const normalized = email.trim().toLowerCase();
  const db = getDb();
  const row = db.select().from(users).where(eq(users.email, normalized)).get();
  return row ?? null;
}

export function findUserById(id: number): UserRow | null {
  const db = getDb();
  const row = db.select().from(users).where(eq(users.id, id)).get();
  return row ?? null;
}

export function findOrCreateUser(email: string): UserRow {
  const normalized = email.trim().toLowerCase();
  const existing = findUserByEmail(normalized);
  if (existing) return existing;
  const db = getDb();
  const now = Date.now();
  const inserted = db
    .insert(users)
    .values({ email: normalized, createdAt: now, updatedAt: now })
    .returning()
    .get();
  return inserted;
}

export function markEmailVerified(userId: number): void {
  const db = getDb();
  const now = Date.now();
  db.update(users)
    .set({ emailVerifiedAt: now, updatedAt: now })
    .where(eq(users.id, userId))
    .run();
}

export function setSmsTemplate(
  userId: number,
  template: string | null,
): void {
  const db = getDb();
  db.update(users)
    .set({ smsTemplate: template, updatedAt: Date.now() })
    .where(eq(users.id, userId))
    .run();
}
