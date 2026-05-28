/**
 * Pre-send compliance + eligibility check for outbound SMS reminders.
 *
 * The pure layer (`evaluateGuardrails`) takes plain inputs so it's trivial
 * to unit-test — no DB. The DB-bound wrapper (`checkCustomerEligibility`)
 * looks up the opt-out + A2P state and delegates to the pure check.
 */

export type GuardrailReason =
  | "no_phone"
  | "invalid_phone"
  | "zero_balance"
  | "opted_out"
  | "outside_hours"
  | "a2p_not_approved";

export type GuardrailDecision =
  | { ok: true }
  | { ok: false; reason: GuardrailReason };

export type EvaluateInput = {
  phone: string | null | undefined;
  amountCents: number;
  optedOut: boolean;
  a2pApproved: boolean;
  /** When true, the cron enforces business hours; the preview UI passes
   *  false so we can show "queued for 9am tomorrow" instead of skipping. */
  enforceHours: boolean;
  /** Local hour of day (0-23) in the customer's tz at the moment the
   *  send would happen. Caller resolves the tz; see contactHours.ts. */
  localHour: number;
  /** Inclusive window. Defaults are 8am open, 9pm close. */
  windowOpenHour: number;
  windowCloseHour: number;
};

const E164 = /^\+[1-9]\d{6,14}$/;

export function evaluateGuardrails(input: EvaluateInput): GuardrailDecision {
  if (!input.phone || input.phone.trim().length === 0) {
    return { ok: false, reason: "no_phone" };
  }
  if (!E164.test(input.phone.trim())) {
    return { ok: false, reason: "invalid_phone" };
  }
  if (input.amountCents <= 0) {
    return { ok: false, reason: "zero_balance" };
  }
  if (input.optedOut) {
    return { ok: false, reason: "opted_out" };
  }
  if (!input.a2pApproved) {
    return { ok: false, reason: "a2p_not_approved" };
  }
  if (input.enforceHours) {
    if (
      input.localHour < input.windowOpenHour ||
      input.localHour >= input.windowCloseHour
    ) {
      return { ok: false, reason: "outside_hours" };
    }
  }
  return { ok: true };
}

/**
 * Default contact-hours window per TCPA: 8am–9pm in the recipient's local
 * time. We treat the org's timezone as the customer's timezone in v1
 * because we don't yet ask customers for theirs; future versions can
 * infer from area code or address.
 */
export const DEFAULT_WINDOW_OPEN = 8;
export const DEFAULT_WINDOW_CLOSE = 21;
