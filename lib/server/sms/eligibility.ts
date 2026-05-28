import "server-only";
import { isA2pApproved } from "../db/a2p";
import { getOrgById } from "../db/organizations";
import { isOptedOut } from "./optOut";
import {
  DEFAULT_WINDOW_CLOSE,
  DEFAULT_WINDOW_OPEN,
  evaluateGuardrails,
  type GuardrailDecision,
} from "./guardrails";

/** A2P enforcement matches the existing twilio/sms.ts policy. */
function a2pRequired(): boolean {
  return (process.env.REQUIRE_A2P ?? "").toLowerCase() === "true";
}

function localHourInTimezone(nowMs: number, timezone: string): number {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });
  const parts = f.formatToParts(new Date(nowMs));
  const hourPart = parts.find((p) => p.type === "hour")?.value ?? "0";
  const hour = Number(hourPart);
  return hour === 24 ? 0 : hour;
}

export type CheckCustomerInput = {
  organizationId: number;
  phone: string | null | undefined;
  amountCents: number;
  /** When true, we apply the contact-hours window. Pass false during the
   *  preview screen so we don't hide eligible customers behind a clock. */
  enforceHours: boolean;
  /** UNIX ms for the would-be send time. Defaults to now. */
  nowMs?: number;
};

export function checkCustomerEligibility(
  input: CheckCustomerInput,
): GuardrailDecision {
  const nowMs = input.nowMs ?? Date.now();
  const org = getOrgById(input.organizationId);
  const tz = org?.timezone || "America/New_York";
  const localHour = localHourInTimezone(nowMs, tz);
  const optedOut = input.phone
    ? isOptedOut(input.organizationId, input.phone)
    : false;
  // The existing send layer treats A2P as enforced only when the flag is
  // set; we mirror that policy so preview + send agree on the same rule.
  const a2pApproved = a2pRequired()
    ? isA2pApproved(input.organizationId)
    : true;
  return evaluateGuardrails({
    phone: input.phone,
    amountCents: input.amountCents,
    optedOut,
    a2pApproved,
    enforceHours: input.enforceHours,
    localHour,
    windowOpenHour: DEFAULT_WINDOW_OPEN,
    windowCloseHour: DEFAULT_WINDOW_CLOSE,
  });
}
