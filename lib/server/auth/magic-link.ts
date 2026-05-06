import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../db/client";
import { magicLinks, type MagicLinkRow } from "../db/schema";
import { findOrCreateUser, markEmailVerified } from "../db/users";
import { sendEmail } from "../email/resend";
import { getAppBaseUrl } from "../env";
import { generateToken, hashToken } from "./tokens";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export type SendResult = { email: string; magicUrl: string };

function buildEmailBody(magicUrl: string): { text: string; html: string } {
  const text = [
    "Click the link below to sign in to Invoice Chase.",
    "",
    magicUrl,
    "",
    "This link expires in 15 minutes.",
    "If you didn't request it, ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a">
      <h1 style="font-size:20px;margin:0 0 16px">Sign in to Invoice Chase</h1>
      <p style="font-size:14px;line-height:1.5;color:#475569">Click the button below to sign in. This link expires in 15 minutes.</p>
      <p style="margin:24px 0">
        <a href="${magicUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;font-size:14px">Sign in</a>
      </p>
      <p style="font-size:12px;color:#94a3b8;line-height:1.5">If the button doesn't work, paste this URL into your browser:<br/><span style="word-break:break-all">${magicUrl}</span></p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">If you didn't request this, you can ignore this email.</p>
    </div>
  `.trim();

  return { text, html };
}

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
  const { text, html } = buildEmailBody(magicUrl);

  if (process.env.NODE_ENV !== "production") {
    console.log(`\n[auth] Magic link for ${email}:\n  ${magicUrl}\n`);
  }

  try {
    await sendEmail({
      to: email,
      subject: "Sign in to Invoice Chase",
      text,
      html,
    });
  } catch (err) {
    console.error("[auth] email delivery failed", err);
    // Don't throw — the magic link is still valid via the console log in dev,
    // and a retry by the user generates a fresh link anyway.
  }

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
