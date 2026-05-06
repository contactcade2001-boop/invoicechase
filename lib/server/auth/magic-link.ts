import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../db/client";
import { magicLinks, type MagicLinkRow } from "../db/schema";
import { findOrCreateUser, markEmailVerified } from "../db/users";
import { getAppBaseUrl } from "../env";
import { generateToken, hashToken } from "./tokens";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export type SendResult = { email: string; magicUrl: string };

export async function requestMagicLink(rawEmail: string): Promise<SendResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("Invalid email address");
  }
  const user = findOrCreateUser(email);
  const token = generateToken();
  const tokenHash = hashToken(token);
  const now = Date.now();
  const db = getDb();
  db.insert(magicLinks)
    .values({
      userId: user.id,
      tokenHash,
      expiresAt: now + TOKEN_TTL_MS,
      createdAt: now,
    })
    .run();

  const magicUrl = `${getAppBaseUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`\n[auth] Magic link for ${email}:\n  ${magicUrl}\n`);
  }

  // TODO: in production, send via email provider (Resend / Postmark / SES).
  return { email, magicUrl };
}

export type VerifyResult = { userId: number };

export async function verifyMagicLink(token: string): Promise<VerifyResult> {
  if (!token) throw new Error("Missing token");
  const tokenHash = hashToken(token);
  const db = getDb();
  const link: MagicLinkRow | undefined = db
    .select()
    .from(magicLinks)
    .where(
      and(eq(magicLinks.tokenHash, tokenHash), isNull(magicLinks.usedAt)),
    )
    .get();
  if (!link) throw new Error("Invalid or already-used token");
  if (link.expiresAt < Date.now()) throw new Error("Token expired");
  const now = Date.now();
  db.update(magicLinks)
    .set({ usedAt: now })
    .where(eq(magicLinks.id, link.id))
    .run();
  markEmailVerified(link.userId);
  return { userId: link.userId };
}
