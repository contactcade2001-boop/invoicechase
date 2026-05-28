import { describe, expect, it } from "vitest";
import {
  DEFAULT_WINDOW_CLOSE,
  DEFAULT_WINDOW_OPEN,
  evaluateGuardrails,
  type EvaluateInput,
} from "@/lib/server/sms/guardrails";
import { buildFirstWinSms } from "@/lib/server/onboarding/firstWinMessage";

function input(over: Partial<EvaluateInput> = {}): EvaluateInput {
  return {
    phone: "+15125550100",
    amountCents: 1_200_00,
    optedOut: false,
    a2pApproved: true,
    enforceHours: true,
    localHour: 10, // mid-morning, inside window
    windowOpenHour: DEFAULT_WINDOW_OPEN,
    windowCloseHour: DEFAULT_WINDOW_CLOSE,
    ...over,
  };
}

describe("evaluateGuardrails (pure compliance check)", () => {
  it("allows a healthy customer with phone + amount + consent + business hours", () => {
    expect(evaluateGuardrails(input())).toEqual({ ok: true });
  });

  it("connect with overdue invoices — at least one passes when phones exist", () => {
    const candidates = [
      input({ phone: "+15125550101", amountCents: 500_00 }),
      input({ phone: "+15125550102", amountCents: 800_00 }),
      input({ phone: null, amountCents: 200_00 }), // no phone -> skip
    ];
    const decisions = candidates.map(evaluateGuardrails);
    expect(decisions[0]).toEqual({ ok: true });
    expect(decisions[1]).toEqual({ ok: true });
    expect(decisions[2]).toEqual({ ok: false, reason: "no_phone" });
  });

  it("connect with NO overdue invoices — empty array stays empty", () => {
    const decisions = ([] as EvaluateInput[]).map(evaluateGuardrails);
    expect(decisions).toEqual([]);
  });

  it("opted-out customer is skipped — never sends", () => {
    expect(evaluateGuardrails(input({ optedOut: true }))).toEqual({
      ok: false,
      reason: "opted_out",
    });
  });

  it("sends respect the time window — before 8am skips with outside_hours", () => {
    expect(evaluateGuardrails(input({ localHour: 7 }))).toEqual({
      ok: false,
      reason: "outside_hours",
    });
  });

  it("sends respect the time window — at 9pm (close) skips", () => {
    // closeHour is exclusive: 21 means last allowed hour is 20.
    expect(evaluateGuardrails(input({ localHour: 21 }))).toEqual({
      ok: false,
      reason: "outside_hours",
    });
  });

  it("sends respect the time window — at 8am (open) allowed", () => {
    expect(evaluateGuardrails(input({ localHour: 8 }))).toEqual({ ok: true });
  });

  it("preview ignores the clock (enforceHours=false) so review isn't gated by time", () => {
    expect(
      evaluateGuardrails(input({ enforceHours: false, localHour: 3 })),
    ).toEqual({ ok: true });
  });

  it("zero-balance row is skipped (no message about $0)", () => {
    expect(evaluateGuardrails(input({ amountCents: 0 }))).toEqual({
      ok: false,
      reason: "zero_balance",
    });
  });

  it("invalid phone format is rejected before any send attempt", () => {
    expect(evaluateGuardrails(input({ phone: "555-0100" }))).toEqual({
      ok: false,
      reason: "invalid_phone",
    });
  });

  it("A2P not approved blocks every send (carrier compliance)", () => {
    expect(evaluateGuardrails(input({ a2pApproved: false }))).toEqual({
      ok: false,
      reason: "a2p_not_approved",
    });
  });

  it("opt-out takes priority over hours — owner sees the right reason", () => {
    // Both fail. Opt-out should win in the order we check.
    const d = evaluateGuardrails(
      input({ optedOut: true, localHour: 3 }),
    );
    expect(d).toEqual({ ok: false, reason: "opted_out" });
  });
});

describe("buildFirstWinSms — message contains opt-out language", () => {
  it("includes Reply STOP language in every message (carrier required)", () => {
    const body = buildFirstWinSms({
      customerName: "Maria Sanchez",
      businessName: "Honest Plumbing",
      amountDollars: "$1,240",
      payUrl: "https://invoicechase.com/p/abc",
    });
    expect(body).toMatch(/STOP/);
  });

  it("personalizes by first name", () => {
    const body = buildFirstWinSms({
      customerName: "Maria Sanchez",
      businessName: "Honest Plumbing",
      amountDollars: "$1,240",
      payUrl: "https://invoicechase.com/p/abc",
    });
    expect(body).toContain("Maria");
    expect(body).not.toContain("Sanchez"); // last name not surfaced
  });

  it("falls back to a friendly default when name is empty", () => {
    const body = buildFirstWinSms({
      customerName: "",
      businessName: "Acme",
      amountDollars: "$100",
      payUrl: "https://x.test/p/1",
    });
    expect(body).toContain("Hi there");
  });

  it("includes the pay link and the business name", () => {
    const body = buildFirstWinSms({
      customerName: "Joe",
      businessName: "Honest Plumbing",
      amountDollars: "$500",
      payUrl: "https://invoicechase.com/p/xyz",
    });
    expect(body).toContain("https://invoicechase.com/p/xyz");
    expect(body).toContain("Honest Plumbing");
    expect(body).toContain("$500");
  });
});
