import { describe, expect, it } from "vitest";
import {
  renderEmailReminder,
  renderSmsReminder,
  toneForDaysLate,
} from "@/lib/server/reminders/tones";

describe("reminders.toneForDaysLate", () => {
  it("returns null when the customer is current or not yet due", () => {
    expect(toneForDaysLate(-7)).toBeNull();
    expect(toneForDaysLate(0)).toBeNull();
  });

  it("uses polite for 1–6 days late", () => {
    expect(toneForDaysLate(1)).toBe("polite");
    expect(toneForDaysLate(6)).toBe("polite");
  });

  it("uses firm for 7–13 days late", () => {
    expect(toneForDaysLate(7)).toBe("firm");
    expect(toneForDaysLate(13)).toBe("firm");
  });

  it("uses final for 14+ days late", () => {
    expect(toneForDaysLate(14)).toBe("final");
    expect(toneForDaysLate(120)).toBe("final");
  });
});

describe("reminders.renderSmsReminder", () => {
  const vars = {
    businessName: "Acme HVAC",
    customerName: "Riverside Diner",
    amountCents: 420000,
    daysLate: 10,
    payUrl: "https://x/pay/abc",
  };

  it("includes amount, business, and pay link in every tone", () => {
    for (const tone of ["polite", "firm", "final"] as const) {
      const text = renderSmsReminder(tone, vars);
      expect(text).toContain("$4,200.00");
      expect(text).toContain("Acme HVAC");
      expect(text).toContain("https://x/pay/abc");
    }
  });

  it("escalates the language across tones", () => {
    const p = renderSmsReminder("polite", vars).toLowerCase();
    const fi = renderSmsReminder("final", vars).toLowerCase();
    expect(p).toContain("friendly");
    expect(fi).toContain("final notice");
  });
});

describe("reminders.renderEmailReminder", () => {
  const vars = {
    businessName: "Acme HVAC",
    customerName: "Bob",
    amountCents: 12500,
    daysLate: 30,
    payUrl: "https://x/pay/xyz",
  };

  it("produces a subject + body for every tone", () => {
    for (const tone of ["polite", "firm", "final"] as const) {
      const out = renderEmailReminder(tone, vars);
      expect(out.subject.length).toBeGreaterThan(0);
      expect(out.text).toContain("Bob");
      expect(out.text).toContain("https://x/pay/xyz");
    }
  });
});
