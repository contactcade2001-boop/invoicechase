import "server-only";
import { cookies } from "next/headers";
import { and, eq, isNull, lt } from "drizzle-orm";
import { generateToken, hashToken } from "../auth/tokens";
import { getDb } from "../db/client";
import {
  customerMagicLinks,
  customerSessions,
  type CustomerMagicLinkRow,
  type CustomerSessionRow,
} from "../db/schema";
import { sendEmail } from "../email/resend";
import { getAppBaseUrl } from "../env";

const PORTAL_COOKIE = "ic_portal_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_TTL_MS = 15 * 60 * 1000;

export type PortalRequestResult = {
  email: string;
  magicUrl: string;
};

export async function requestPortalMagicLink(
  rawEmail: string,
): Promise<PortalRequestResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Invalid email address");
  const db = getDb();
  const token = generateToken();
  const tokenHash = hashToken(token);
  const now = Date.now();
  db.insert(customerMagicLinks)
    .values({
      email,
      tokenHash,
      expiresAt: now + TOKEN_TTL_MS,
      createdAt: now,
    })
    .run();
  const magicUrl = `${getAppBaseUrl()}/portal/verify?token=${encodeURIComponent(token)}`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`\n[portal] Magic link for ${email}:\n  ${magicUrl}\n`);
  }

  try {
    await sendEmail({
      to: email,
      subject: "Sign in to view your payments",
      text: [
        "Click the link below to view payments and active payment links you have with businesses on Invoice Chase.",
        "",
        magicUrl,
        "",
        "This link expires in 15 minutes. If you didn't request it, ignore this email.",
      ].join("\n"),
    });
  } catch (err) {
    console.error("[portal] email delivery failed", err);
  }

  return { email, magicUrl };
}

export type PortalVerifyResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

export function verifyPortalMagicLink(token: string): PortalVerifyResult {
  if (!token) return { ok: false, error: "missing_token" };
  const tokenHash = hashToken(token);
  const db = getDb();
  const link: CustomerMagicLinkRow | undefined = db
    .select()
    .from(customerMagicLinks)
    .where(
      and(
        eq(customerMagicLinks.tokenHash, tokenHash),
        isNull(customerMagicLinks.usedAt),
      ),
    )
    .get();
  if (!link) return { ok: false, error: "invalid_or_used" };
  if (link.expiresAt < Date.now()) return { ok: false, error: "expired" };
  db.update(customerMagicLinks)
    .set({ usedAt: Date.now() })
    .where(eq(customerMagicLinks.id, link.id))
    .run();
  return { ok: true, email: link.email };
}

export async function createPortalSession(email: string): Promise<string> {
  const db = getDb();
  const id = generateToken();
  const now = Date.now();
  db.insert(customerSessions)
    .values({
      id,
      email,
      expiresAt: now + SESSION_TTL_MS,
      createdAt: now,
    })
    .run();
  const jar = await cookies();
  jar.set(PORTAL_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return id;
}

export async function destroyCurrentPortalSession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(PORTAL_COOKIE)?.value;
  if (id) {
    const db = getDb();
    db.delete(customerSessions).where(eq(customerSessions.id, id)).run();
  }
  jar.delete(PORTAL_COOKIE);
}

function pruneExpiredSessions() {
  const db = getDb();
  db.delete(customerSessions)
    .where(lt(customerSessions.expiresAt, Date.now()))
    .run();
}

export async function getCurrentCustomerEmail(): Promise<string | null> {
  const jar = await cookies();
  const id = jar.get(PORTAL_COOKIE)?.value;
  if (!id) return null;
  const db = getDb();
  const row: CustomerSessionRow | undefined = db
    .select()
    .from(customerSessions)
    .where(eq(customerSessions.id, id))
    .get();
  if (!row) return null;
  if (row.expiresAt < Date.now()) {
    pruneExpiredSessions();
    return null;
  }
  return row.email;
}
