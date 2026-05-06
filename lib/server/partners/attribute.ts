import "server-only";
import { findPartnerByCode, recordReferral } from "../db/partners";
import {
  ensureOrgForUser,
  findOrgByCustomerReferralCode,
  setReferredBy,
} from "../db/organizations";
import { recordOrgReferral } from "../db/orgReferrals";
import { findUserById } from "../db/users";
import { captureException } from "../observability";

// Best-effort attribution. Never throws — a partner-link bug must not block
// sign-in.
export function attributeNewSignup(input: {
  userId: number;
  referralCode: string | null;
  orgReferralCode?: string | null;
}): void {
  try {
    const user = findUserById(input.userId);
    if (!user) return;
    const org = ensureOrgForUser(user);

    if (input.referralCode) {
      const partner = findPartnerByCode(input.referralCode.toLowerCase());
      if (partner && partner.status === "active" && partner.userId !== user.id) {
        recordReferral({ partnerId: partner.id, organizationId: org.id });
      }
    }

    if (input.orgReferralCode) {
      const referrer = findOrgByCustomerReferralCode(
        input.orgReferralCode.toLowerCase(),
      );
      if (referrer && referrer.id !== org.id) {
        recordOrgReferral({
          referrerOrgId: referrer.id,
          refereeOrgId: org.id,
        });
        setReferredBy(org.id, referrer.id);
      }
    }
  } catch (err) {
    captureException(err, {
      where: "partners.attribute",
      userId: input.userId,
    });
  }
}
