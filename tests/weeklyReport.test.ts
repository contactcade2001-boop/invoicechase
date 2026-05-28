import { describe, expect, it } from "vitest";
import {
  buildWeeklyReport,
  type WeekFacts,
} from "@/lib/server/reports/weeklyReport";
import {
  isInDeliveryWindow,
  localParts,
  weekKey,
} from "@/lib/server/reports/weeklySchedule";

function baseFacts(over: Partial<WeekFacts> = {}): WeekFacts {
  return {
    businessName: "Honest Plumbing",
    weekRangeLabel: "Mar 18 – Mar 24",
    totalCollectedCents: 0,
    paidInvoiceCount: 0,
    attributedCents: 0,
    items: [],
    baselineDsoDays: 47,
    currentDsoDays: 19,
    remindersSentThisWeek: 0,
    autopayActiveCount: 0,
    invoicesNowCurrent: 0,
    dashboardUrl: "https://invoicechase.com/dashboard",
    ...over,
  };
}

describe("buildWeeklyReport", () => {
  it("normal week — standard report with DSO improvement headline", () => {
    const r = buildWeeklyReport(
      baseFacts({
        totalCollectedCents: 3_180_00,
        paidInvoiceCount: 4,
        attributedCents: 2_500_00,
        items: [
          { customerName: "Acme HVAC", amountCents: 1_200_00, daysToPayment: 12, attributed: true },
          { customerName: "Maple Cafe", amountCents: 800_00, daysToPayment: 9, attributed: true },
        ],
      }),
    );
    expect(r.kind).toBe("standard");
    if (r.kind !== "standard") return;
    expect(r.sms).toContain("$3,180");
    expect(r.sms).toContain("4 invoices");
    // DSO improvement phrasing — explicit numbers, not fabricated.
    expect(r.sms).toContain("47 to 19 days");
    expect(r.email.subject).toContain("$3,180");
    expect(r.email.text).toContain("Acme HVAC");
    expect(r.email.text).toContain("Maple Cafe");
    expect(r.email.html).toContain("79%"); // 2500 / 3180 ≈ 78.6% rounds to 79
  });

  it("normal week — single invoice uses singular noun", () => {
    const r = buildWeeklyReport(
      baseFacts({
        totalCollectedCents: 500_00,
        paidInvoiceCount: 1,
        attributedCents: 0,
      }),
    );
    if (r.kind !== "standard") throw new Error("expected standard");
    expect(r.sms).toContain("1 invoice this week");
    expect(r.sms).not.toContain("1 invoices");
  });

  it("normal week — no baseline yet uses fallback DSO copy (no fake numbers)", () => {
    const r = buildWeeklyReport(
      baseFacts({
        totalCollectedCents: 1_000_00,
        paidInvoiceCount: 2,
        baselineDsoDays: null,
        currentDsoDays: 22,
      }),
    );
    if (r.kind !== "standard") throw new Error("expected standard");
    expect(r.sms).toContain("22 days");
    expect(r.sms).not.toContain("dropped from");
    expect(r.sms).not.toContain("null");
  });

  it("zero-collection week WITH background activity → reinforce, never $0", () => {
    const r = buildWeeklyReport(
      baseFacts({
        totalCollectedCents: 0,
        paidInvoiceCount: 0,
        remindersSentThisWeek: 8,
        autopayActiveCount: 3,
        invoicesNowCurrent: 2,
      }),
    );
    expect(r.kind).toBe("zero-week");
    if (r.kind !== "zero-week") return;
    expect(r.sms).not.toContain("$0");
    expect(r.sms).toContain("8 reminders sent");
    expect(r.sms).toContain("3 customers on autopay");
    expect(r.email.subject).toContain("quiet week");
  });

  it("zero-collection week with NO background activity → skip, no message", () => {
    const r = buildWeeklyReport(
      baseFacts({
        totalCollectedCents: 0,
        paidInvoiceCount: 0,
        remindersSentThisWeek: 0,
        autopayActiveCount: 0,
        invoicesNowCurrent: 0,
      }),
    );
    expect(r.kind).toBe("skip");
    if (r.kind === "skip") {
      expect(r.reason).toBe("no-activity");
    }
  });

  it("uses real numbers only — never substitutes when paidInvoiceCount mismatches totals", () => {
    const r = buildWeeklyReport(
      baseFacts({
        totalCollectedCents: 100_00,
        paidInvoiceCount: 3,
      }),
    );
    if (r.kind !== "standard") throw new Error("expected standard");
    // The builder shouldn't invent counts; it echoes what came in.
    expect(r.sms).toContain("3 invoices");
    expect(r.sms).toContain("$100");
  });
});

describe("weeklySchedule.isInDeliveryWindow", () => {
  it("US East Friday 9am — fires for an org configured Fri 9am ET", () => {
    // 2026-03-20 is a Friday. 9am ET = 13:00 UTC (during standard time).
    // We pick a DST-stable date to avoid spring-forward / fall-back drift.
    const utc = Date.UTC(2026, 0, 23, 14, 30); // 2026-01-23 (Fri) 14:30 UTC = 9:30 ET
    expect(
      isInDeliveryWindow({
        nowMs: utc,
        timezone: "America/New_York",
        dow: 5, // Fri
        hour: 9,
      }),
    ).toBe(true);
  });

  it("US East Friday 9am — does NOT fire for an org configured Mon 9am ET", () => {
    const utc = Date.UTC(2026, 0, 23, 14, 30); // Friday
    expect(
      isInDeliveryWindow({
        nowMs: utc,
        timezone: "America/New_York",
        dow: 1, // Mon
        hour: 9,
      }),
    ).toBe(false);
  });

  it("non-US timezone — UTC instant resolves to the right local day+hour", () => {
    // 2026-01-23 13:00 UTC = 22:00 Asia/Tokyo (Fri) = 14:00 Europe/London (Fri).
    const utc = Date.UTC(2026, 0, 23, 13, 0);
    // Owner in Tokyo set Fri 22:00 — should fire.
    expect(
      isInDeliveryWindow({
        nowMs: utc,
        timezone: "Asia/Tokyo",
        dow: 5,
        hour: 22,
      }),
    ).toBe(true);
    // Same owner with wrong hour — should not.
    expect(
      isInDeliveryWindow({
        nowMs: utc,
        timezone: "Asia/Tokyo",
        dow: 5,
        hour: 9,
      }),
    ).toBe(false);
    // Owner in London set Fri 14:00 — should fire.
    // London in January is GMT (no DST), so 13:00 UTC == 13:00 London.
    expect(
      isInDeliveryWindow({
        nowMs: utc,
        timezone: "Europe/London",
        dow: 5,
        hour: 13,
      }),
    ).toBe(true);
  });

  it("crosses midnight — UTC late evening = Sat morning in Tokyo", () => {
    // 2026-01-23 23:00 UTC = 2026-01-24 08:00 Asia/Tokyo (Sat).
    const utc = Date.UTC(2026, 0, 23, 23, 0);
    // Tokyo owner with Sat 8am — should fire.
    expect(
      isInDeliveryWindow({
        nowMs: utc,
        timezone: "Asia/Tokyo",
        dow: 6,
        hour: 8,
      }),
    ).toBe(true);
    // The same UTC instant is still Friday in NY (18:00) — Fri 6pm fires.
    expect(
      isInDeliveryWindow({
        nowMs: utc,
        timezone: "America/New_York",
        dow: 5,
        hour: 18,
      }),
    ).toBe(true);
  });
});

describe("weeklySchedule.weekKey", () => {
  it("two cron runs on the same local week produce the same key", () => {
    // Mon and Wed of the same week in NY.
    const mon = Date.UTC(2026, 0, 19, 14, 0);
    const wed = Date.UTC(2026, 0, 21, 14, 0);
    expect(weekKey(mon, "America/New_York")).toEqual(
      weekKey(wed, "America/New_York"),
    );
  });

  it("crosses week boundary in the owner's timezone", () => {
    // Sun night NY (UTC Mon morning) vs the following Mon are different
    // weeks in NY.
    const sunNy = Date.UTC(2026, 0, 19, 1, 0); // 2026-01-18 20:00 NY (Sun)
    const monNy = Date.UTC(2026, 0, 19, 14, 0); // 2026-01-19 09:00 NY (Mon)
    expect(weekKey(sunNy, "America/New_York")).not.toEqual(
      weekKey(monNy, "America/New_York"),
    );
  });
});

describe("scheduler honors per-owner toggle", () => {
  // The cron checks `org.weeklyReportEnabled` before calling builders.
  // We assert that the BUILDER is independent of the toggle — i.e. it
  // doesn't accidentally short-circuit on its own — so a future caller
  // (e.g. "send me a preview") still works.
  it("buildWeeklyReport ignores the toggle (toggle is the cron's job)", () => {
    const r = buildWeeklyReport(
      baseFacts({
        totalCollectedCents: 100_00,
        paidInvoiceCount: 1,
      }),
    );
    expect(r.kind).toBe("standard");
  });
});

describe("localParts sanity", () => {
  it("formats midnight in the target tz as hour 0, not 24", () => {
    // 2026-01-23 05:00 UTC = 2026-01-23 00:00 NY (just past midnight).
    const utc = Date.UTC(2026, 0, 23, 5, 0);
    const lp = localParts(utc, "America/New_York");
    expect(lp.hour).toBe(0);
    expect(lp.weekday).toBe(5); // still Friday in NY
  });
});
