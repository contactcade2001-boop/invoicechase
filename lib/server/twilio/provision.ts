import "server-only";
import { setOrgTwilioPhone } from "../db/organizations";
import { getAppBaseUrl } from "../env";
import { getTwilio } from "./client";

export type ProvisionResult =
  | { ok: true; phoneNumber: string }
  | { ok: false; error: string };

// Searches Twilio for an SMS-capable US local number, optionally near an area
// code, buys it on the platform's account, and points its inbound webhook at
// our /api/sms/inbound. Stores on the org so all outbound + inbound for that
// org flow through it.
export async function provisionNumberForOrg(input: {
  organizationId: number;
  areaCode?: string;
}): Promise<ProvisionResult> {
  const client = getTwilio();
  const baseUrl = getAppBaseUrl();
  const smsUrl = `${baseUrl}/api/sms/inbound`;

  let candidates;
  try {
    candidates = await client.availablePhoneNumbers("US").local.list({
      areaCode: input.areaCode ? Number(input.areaCode) : undefined,
      smsEnabled: true,
      limit: 5,
    });
  } catch (err) {
    console.error("[twilio-provision] search failed", err);
    return { ok: false, error: "search_failed" };
  }
  const pick = candidates[0];
  if (!pick?.phoneNumber) {
    return { ok: false, error: "none_available" };
  }

  let purchased;
  try {
    purchased = await client.incomingPhoneNumbers.create({
      phoneNumber: pick.phoneNumber,
      smsUrl,
      smsMethod: "POST",
    });
  } catch (err) {
    console.error("[twilio-provision] purchase failed", err);
    return { ok: false, error: "purchase_failed" };
  }
  const phoneNumber = purchased.phoneNumber ?? pick.phoneNumber;
  setOrgTwilioPhone(input.organizationId, phoneNumber);
  return { ok: true, phoneNumber };
}
