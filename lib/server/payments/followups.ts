import "server-only";
import { captureException } from "../observability";
import { getOrgById } from "../db/organizations";
import { sendRawSms } from "../twilio/sms";

/**
 * After a successful payment, optionally send (1) a thank-you SMS and
 * (2) a review-request SMS, based on org settings. Both are no-ops if
 * disabled. Each send is best-effort — failures are logged, not thrown.
 */
export async function sendPaymentFollowups(input: {
  organizationId: number;
  customerName: string | null;
  customerPhone: string | null;
  amountCents: number;
}): Promise<{ thankYou: boolean; reviewRequest: boolean }> {
  const out = { thankYou: false, reviewRequest: false };
  if (!input.customerPhone) return out;

  const org = getOrgById(input.organizationId);
  if (!org) return out;

  const firstName =
    input.customerName?.split(/\s+/)[0]?.trim() || "there";
  const dollars = (input.amountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  // 1. Thank-you SMS
  if (org.thankYouOnPaymentEnabled === 1) {
    try {
      await sendRawSms({
        to: input.customerPhone,
        body: `Thanks ${firstName}! We received your ${dollars} payment to ${org.name}. Receipt is on its way to your email. — ${org.name}`,
        organizationId: input.organizationId,
      });
      out.thankYou = true;
    } catch (err) {
      captureException(err, {
        where: "followups.thankYou",
        orgId: input.organizationId,
      });
    }
  }

  // 2. Review request — only if a URL is configured. We delay by piggy-backing
  // on the same message text but as a second send so customers don't see
  // both at once.
  if (org.reviewRequestEnabled === 1 && org.reviewRequestUrl) {
    try {
      await sendRawSms({
        to: input.customerPhone,
        body: `${firstName}, mind taking 20 seconds to leave us a quick review? It really helps us. ${org.reviewRequestUrl}`,
        organizationId: input.organizationId,
      });
      out.reviewRequest = true;
    } catch (err) {
      captureException(err, {
        where: "followups.reviewRequest",
        orgId: input.organizationId,
      });
    }
  }

  return out;
}
