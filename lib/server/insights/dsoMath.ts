/**
 * Pure functions for Days Sales Outstanding (DSO) computation.
 *
 * Inputs are plain payment-event objects so this module is trivially unit
 * testable — no DB, no server-only imports. The DB-bound service wraps
 * these.
 *
 * Definitions used here:
 *  - DSO = mean of (paidAt − issuedAt) in days, across paid events in a
 *    window.
 *  - An "event" is one invoice fully paid in one shot OR one installment
 *    of a payment plan. Each installment counts as a separate event so
 *    plans that drag on lift DSO accurately.
 *  - Partial payments that DON'T close the balance are not events for DSO
 *    purposes; we only count a row when cash actually settles.
 *  - Refunds and zero-amount rows are ignored.
 */

export type PaymentEvent = {
  /** UNIX ms the original invoice was issued. */
  issuedAt: number;
  /** UNIX ms the (full or installment) payment settled. */
  paidAt: number;
  /** Cents collected on this event. Negative / zero rows are filtered out. */
  amountCents: number;
};

export type DsoResult = {
  /** Mean days-to-payment. 0 when no events. */
  dsoDays: number;
  /** Number of events used. */
  paidInvoiceCount: number;
  /** Total cents settled across the events. */
  totalCollectedCents: number;
};

export function computeDsoFromEvents(events: PaymentEvent[]): DsoResult {
  const valid = events.filter(
    (e) => e.amountCents > 0 && e.paidAt >= e.issuedAt,
  );
  if (valid.length === 0) {
    return { dsoDays: 0, paidInvoiceCount: 0, totalCollectedCents: 0 };
  }
  let totalDays = 0;
  let totalCents = 0;
  for (const e of valid) {
    const days = Math.round((e.paidAt - e.issuedAt) / 86_400_000);
    totalDays += days;
    totalCents += e.amountCents;
  }
  return {
    dsoDays: Math.round(totalDays / valid.length),
    paidInvoiceCount: valid.length,
    totalCollectedCents: totalCents,
  };
}

/**
 * Filter events to a paid-at window, then compute. The DB layer slices
 * with SQL when possible; this helper covers the in-memory case (tests +
 * backfill from a fetched batch).
 */
export function computeDsoInWindow(
  events: PaymentEvent[],
  fromTs: number,
  toTs: number,
): DsoResult {
  const inWindow = events.filter(
    (e) => e.paidAt >= fromTs && e.paidAt <= toTs,
  );
  return computeDsoFromEvents(inWindow);
}
