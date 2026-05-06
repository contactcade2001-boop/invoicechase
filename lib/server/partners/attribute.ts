import "server-only";
import { findPartnerByCode, recordReferral } from "../db/partners";
import { ensureOrgForUser } from "../db/organizations";
import { findUserById } from "../db/users";
import { captureException } from "../observability";

// Best-effort attribution. Never throws — a partner-link bug must not block
// sign-in.
export function attributeNewSignup(input: {
  userId: number;
  referralCode: string | null;
}): void {
  if (!input.referralCode) return;
  try {
    const partner = findPartnerByCode(input.referralCode.toLowerCase());
    if (!partner || partner.status !== "active") return;
    const user = findUserById(input.userId);
    if (!user) return;
    const org = ensureOrgForUser(user);
    if (partner.userId === user.id) return; // self-referral guard
    recordReferral({ partnerId: partner.id, organizationId: org.id });
  } catch (err) {
    captureException(err, {
      where: "partners.attribute",
      userId: input.userId,
    });
  }
}
