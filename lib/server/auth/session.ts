import "server-only";
import { cookies } from "next/headers";
import { eq, lt } from "drizzle-orm";
import { getDb } from "../db/client";
import { findUserById } from "../db/users";
import {
  sessions,
  type SessionRow,
  type UserRow,
} from "../db/schema";
import { generateToken } from "./tokens";

export const SESSION_COOKIE = "ic_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function createSession(userId: number): Promise<string> {
  const db = getDb();
  const id = generateToken();
  const now = Date.now();
  db.insert(sessions)
    .values({
      id,
      userId,
      expiresAt: now + SESSION_TTL_MS,
      createdAt: now,
    })
    .run();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return id;
}

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    const db = getDb();
    db.delete(sessions).where(eq(sessions.id, id)).run();
  }
  jar.delete(SESSION_COOKIE);
}

function pruneExpired() {
  const db = getDb();
  db.delete(sessions).where(lt(sessions.expiresAt, Date.now())).run();
}

export async function getCurrentUser(): Promise<UserRow | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const db = getDb();
  const session: SessionRow | undefined = db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .get();
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    pruneExpired();
    return null;
  }
  return findUserById(session.userId);
}

export async function requireUser(): Promise<UserRow> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
