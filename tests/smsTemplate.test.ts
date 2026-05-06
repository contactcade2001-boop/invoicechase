import { describe, expect, it } from "vitest";
import {
  DEFAULT_SMS_TEMPLATE,
  renderSmsBody,
  substituteSmsTokens,
} from "@/lib/smsTemplate";

describe("smsTemplate", () => {
  it("falls back to the default template when blank", () => {
    const out = renderSmsBody("", {
      amountCents: 420000,
      payUrl: "https://x/pay/1",
      customerName: "Riverside",
      businessName: "Acme",
    });
    expect(out).toBe("Pay $4,200.00 now: https://x/pay/1");
  });

  it("substitutes every supported token", () => {
    const out = substituteSmsTokens(
      "Hi {customer}, {business} expects {amount}: {link}",
      {
        amount: "$1,200.00",
        link: "https://x/pay/2",
        customer: "Bob",
        business: "Acme HVAC",
      },
    );
    expect(out).toBe(
      "Hi Bob, Acme HVAC expects $1,200.00: https://x/pay/2",
    );
  });

  it("replaces all occurrences of a token", () => {
    const out = substituteSmsTokens("{amount} or {amount}?", {
      amount: "$50",
      link: "x",
      customer: "x",
      business: "x",
    });
    expect(out).toBe("$50 or $50?");
  });

  it("uses the default template constant verbatim", () => {
    expect(DEFAULT_SMS_TEMPLATE).toBe("Pay {amount} now: {link}");
  });
});
