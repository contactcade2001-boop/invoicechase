import { describe, expect, it } from "vitest";
import {
  DEFAULT_EMAIL_BODY,
  renderEmailReminder,
} from "@/lib/emailReminderTemplate";

describe("emailReminderTemplate.renderEmailReminder", () => {
  const vars = {
    amountCents: 420000,
    payUrl: "https://x/pay/abc",
    customerName: "Riverside Diner",
    businessName: "Acme HVAC",
  };

  it("falls back to default subject + body when both blank", () => {
    const out = renderEmailReminder({ subject: null, body: null }, vars);
    expect(out.subject).toBe("Friendly reminder from Acme HVAC");
    expect(out.text).toContain("Hi Riverside Diner,");
    expect(out.text).toContain("$4,200.00");
    expect(out.text).toContain("https://x/pay/abc");
  });

  it("substitutes tokens in custom body", () => {
    const out = renderEmailReminder(
      {
        subject: "{business} reminder",
        body: "{customer}, you owe {amount}. Pay: {link}",
      },
      vars,
    );
    expect(out.subject).toBe("Acme HVAC reminder");
    expect(out.text).toBe(
      "Riverside Diner, you owe $4,200.00. Pay: https://x/pay/abc",
    );
  });

  it("auto-links the pay URL in the html version", () => {
    const out = renderEmailReminder(
      { subject: null, body: "Pay here: {link}" },
      vars,
    );
    expect(out.html).toContain('<a href="https://x/pay/abc"');
  });

  it("escapes hostile content in the body but preserves the auto-link", () => {
    const out = renderEmailReminder(
      {
        subject: null,
        body: "Hi <script>alert(1)</script> click {link}",
      },
      vars,
    );
    expect(out.html).not.toContain("<script>");
    expect(out.html).toContain("&lt;script&gt;");
    expect(out.html).toContain('<a href="https://x/pay/abc"');
  });

  it("exposes the default body shape for callers", () => {
    expect(DEFAULT_EMAIL_BODY).toContain("{amount}");
    expect(DEFAULT_EMAIL_BODY).toContain("{link}");
  });
});
