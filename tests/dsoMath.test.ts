import { describe, expect, it } from "vitest";
import {
  computeDsoFromEvents,
  computeDsoInWindow,
  type PaymentEvent,
} from "@/lib/server/insights/dsoMath";

const DAY = 86_400_000;

function event(daysIssued: number, daysToPay: number, cents = 100_00): PaymentEvent {
  const now = Date.now();
  const issuedAt = now - daysIssued * DAY;
  const paidAt = issuedAt + daysToPay * DAY;
  return { issuedAt, paidAt, amountCents: cents };
}

describe("computeDsoFromEvents", () => {
  it("returns zeroes for an empty array (no paid invoices yet)", () => {
    expect(computeDsoFromEvents([])).toEqual({
      dsoDays: 0,
      paidInvoiceCount: 0,
      totalCollectedCents: 0,
    });
  });

  it("averages the days-to-payment across events", () => {
    const r = computeDsoFromEvents([
      event(60, 10),
      event(50, 20),
      event(40, 30),
    ]);
    expect(r.dsoDays).toBe(20);
    expect(r.paidInvoiceCount).toBe(3);
    expect(r.totalCollectedCents).toBe(300_00);
  });

  it("rounds to the nearest integer day", () => {
    // 1, 2, 2 -> avg 1.66 -> rounds to 2
    const r = computeDsoFromEvents([event(5, 1), event(5, 2), event(5, 2)]);
    expect(r.dsoDays).toBe(2);
  });

  it("ignores zero-amount and negative-amount rows (refunds)", () => {
    const r = computeDsoFromEvents([
      event(5, 10, 100_00),
      event(5, 20, 0),
      event(5, 30, -50_00),
    ]);
    expect(r.paidInvoiceCount).toBe(1);
    expect(r.dsoDays).toBe(10);
    expect(r.totalCollectedCents).toBe(100_00);
  });

  it("ignores events where paid date precedes issue date (data bug)", () => {
    const issuedAt = Date.now();
    const r = computeDsoFromEvents([
      { issuedAt, paidAt: issuedAt - DAY, amountCents: 100_00 },
      { issuedAt, paidAt: issuedAt + 10 * DAY, amountCents: 100_00 },
    ]);
    expect(r.paidInvoiceCount).toBe(1);
    expect(r.dsoDays).toBe(10);
  });

  it("counts payment-plan installments as separate events", () => {
    // One $1200 invoice paid in 4 weekly installments of $300:
    //   week 1: paid 7d after issue
    //   week 2: 14d
    //   week 3: 21d
    //   week 4: 28d
    // DSO = mean = 17.5 -> rounds to 18.
    const r = computeDsoFromEvents([
      event(40, 7, 300_00),
      event(40, 14, 300_00),
      event(40, 21, 300_00),
      event(40, 28, 300_00),
    ]);
    expect(r.paidInvoiceCount).toBe(4);
    expect(r.dsoDays).toBe(18);
    expect(r.totalCollectedCents).toBe(1200_00);
  });

  it("handles same-day payment (zero days to pay)", () => {
    const r = computeDsoFromEvents([event(5, 0, 50_00)]);
    expect(r.dsoDays).toBe(0);
    expect(r.paidInvoiceCount).toBe(1);
  });

  it("handles an invoice paid before any reminder — math doesn't change", () => {
    // The math layer is reminder-agnostic. Whether attribution exists is
    // a separate concern (paid_invoices.attributed_reminder_id). DSO
    // counts the event identically either way.
    const r = computeDsoFromEvents([event(10, 3, 500_00)]);
    expect(r.dsoDays).toBe(3);
    expect(r.totalCollectedCents).toBe(500_00);
  });

  it("partial payments that don't close the balance are not events here", () => {
    // Repo layer is responsible for only inserting paid_invoices rows
    // when cash actually settles a slice. We model that here by trusting
    // the caller — but verify a single completed slice computes
    // correctly.
    const r = computeDsoFromEvents([event(30, 15, 250_00)]);
    expect(r.paidInvoiceCount).toBe(1);
    expect(r.dsoDays).toBe(15);
    expect(r.totalCollectedCents).toBe(250_00);
  });
});

describe("computeDsoInWindow", () => {
  it("includes only events whose paidAt is inside the window", () => {
    const now = Date.now();
    const events: PaymentEvent[] = [
      // paid 50d ago — outside a 30d window
      { issuedAt: now - 60 * DAY, paidAt: now - 50 * DAY, amountCents: 100_00 },
      // paid 10d ago — inside
      { issuedAt: now - 25 * DAY, paidAt: now - 10 * DAY, amountCents: 200_00 },
      // paid 1d ago — inside
      { issuedAt: now - 6 * DAY, paidAt: now - 1 * DAY, amountCents: 300_00 },
    ];
    const r = computeDsoInWindow(events, now - 30 * DAY, now);
    expect(r.paidInvoiceCount).toBe(2);
    // (15 + 5) / 2 = 10
    expect(r.dsoDays).toBe(10);
    expect(r.totalCollectedCents).toBe(500_00);
  });

  it("empty window returns zeroes (no paid invoices in range)", () => {
    const now = Date.now();
    const events: PaymentEvent[] = [
      { issuedAt: now - 60 * DAY, paidAt: now - 50 * DAY, amountCents: 100_00 },
    ];
    const r = computeDsoInWindow(events, now - 30 * DAY, now);
    expect(r).toEqual({
      dsoDays: 0,
      paidInvoiceCount: 0,
      totalCollectedCents: 0,
    });
  });
});
