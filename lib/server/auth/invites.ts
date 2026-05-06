import "server-only";
import {
  deleteInvite,
  findActiveInvite,
  insertInvite,
  listInvitesForOrg,
  markInviteUsed,
  moveUserToOrg,
  removeUserFromOrg,
  setUserRole,
} from "../db/organizations";
import { findOrCreateUser } from "../db/users";
import { sendEmail } from "../email/resend";
import { getAppBaseUrl } from "../env";
import { generateToken, hashToken } from "./tokens";
import type { UserRole } from "../db/schema";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type InviteRequestResult =
  | { ok: true; inviteUrl: string }
  | { ok: false; error: string };

export async function requestOrgInvite(input: {
  organizationId: number;
  organizationName: string;
  inviterEmail: string;
  email: string;
  role: UserRole;
}): Promise<InviteRequestResult> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) return { ok: false, error: "invalid_email" };
  const token = generateToken();
  const tokenHash = hashToken(token);
  insertInvite({
    organizationId: input.organizationId,
    email,
    role: input.role,
    tokenHash,
    expiresAt: Date.now() + INVITE_TTL_MS,
  });
  const inviteUrl = `${getAppBaseUrl()}/team/accept?token=${encodeURIComponent(token)}`;

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `\n[team] Invite for ${email} (role=${input.role}):\n  ${inviteUrl}\n`,
    );
  }

  try {
    await sendEmail({
      to: email,
      subject: `${input.inviterEmail} invited you to ${input.organizationName} on Invoice Chase`,
      text: [
        `${input.inviterEmail} invited you to join ${input.organizationName} on Invoice Chase as a ${input.role}.`,
        "",
        "Accept the invitation here:",
        inviteUrl,
        "",
        "This link expires in 7 days.",
      ].join("\n"),
    });
  } catch (err) {
    console.error("[team] invite email delivery failed", err);
  }

  return { ok: true, inviteUrl };
}

export type InviteAcceptResult =
  | { ok: true; userId: number }
  | { ok: false; error: string };

export function acceptOrgInvite(token: string): InviteAcceptResult {
  if (!token) return { ok: false, error: "missing_token" };
  const tokenHash = hashToken(token);
  const invite = findActiveInvite(tokenHash);
  if (!invite) return { ok: false, error: "invalid_or_used" };
  if (invite.expiresAt < Date.now()) {
    return { ok: false, error: "expired" };
  }
  const user = findOrCreateUser(invite.email);
  moveUserToOrg(user.id, invite.organizationId, invite.role as UserRole);
  markInviteUsed(invite.id);
  return { ok: true, userId: user.id };
}

export {
  listInvitesForOrg,
  deleteInvite,
  removeUserFromOrg,
  setUserRole,
};
