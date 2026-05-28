import "server-only";
import {
  emailStandard,
  emailZeroWeek,
  smsStandard,
  smsZeroWeek,
  type EmailLineItem,
} from "./weeklyTemplates";

/* The builder is intentionally pure with respect to side effects: it
 * takes the raw facts (computed by the cron from the DB) and returns
 * one of three outcomes: "send standard", "send zero-week", or "skip".
 *
 * The thresholds + rules live HERE so they're easy to tune without
 * touching the cron or DB layer. */

export type WeekFacts = {
  businessName: string;
  weekRangeLabel: string;
  /** Total cents collected in the trailing 7d window. */
  totalCollectedCents: number;
  /** Paid-invoice count in the same window. */
  paidInvoiceCount: number;
  /** Cents that landed within 14d of a reminder. */
  attributedCents: number;
  /** Itemized rows for the email body. SMS doesn't use these. */
  items: { customerName: string; amountCents: number; daysToPayment: number; attributed: boolean }[];
  baselineDsoDays: number | null;
  currentDsoDays: number;
  /** Background-activity stats for the zero-week template. */
  remindersSentThisWeek: number;
  autopayActiveCount: number;
  invoicesNowCurrent: number;
  dashboardUrl: string;
};

export type BuiltReport =
  | {
      kind: "standard";
      sms: string;
      email: { subject: string; text: string; html: string };
    }
  | {
      kind: "zero-week";
      sms: string;
      email: { subject: string; text: string; html: string };
    }
  | { kind: "skip"; reason: string };

/**
 * Decide what to send for this week, or whether to skip entirely.
 *
 * Rules (intentionally explicit so they're easy to tune):
 *   1. If totalCollectedCents > 0 → standard report.
 *   2. If totalCollectedCents === 0 AND there's at least one meaningful
 *      background signal (a reminder was sent, autopay is active, or
 *      invoices moved from overdue to current) → zero-week reinforce.
 *   3. Otherwise → skip with reason "no-activity". Better to say nothing
 *      than send a hollow $0 message.
 */
export function buildWeeklyReport(facts: WeekFacts): BuiltReport {
  if (facts.totalCollectedCents > 0) {
    const totalDollars = facts.totalCollectedCents / 100;
    const attributedDollars = facts.attributedCents / 100;
    const itemDollars: EmailLineItem[] = facts.items.map((i) => ({
      customerName: i.customerName,
      amountDollars: i.amountCents / 100,
      daysToPayment: i.daysToPayment,
      attributed: i.attributed,
    }));
    const standard = {
      businessName: facts.businessName,
      weekRangeLabel: facts.weekRangeLabel,
      totalCollectedDollars: totalDollars,
      paidInvoiceCount: facts.paidInvoiceCount,
      baselineDsoDays: facts.baselineDsoDays,
      currentDsoDays: facts.currentDsoDays,
      attributedDollars,
    };
    return {
      kind: "standard",
      sms: smsStandard(standard),
      email: emailStandard({
        ...standard,
        items: itemDollars,
        dashboardUrl: facts.dashboardUrl,
      }),
    };
  }

  const hasBackgroundSignal =
    facts.remindersSentThisWeek > 0 ||
    facts.autopayActiveCount > 0 ||
    facts.invoicesNowCurrent > 0;

  if (!hasBackgroundSignal) {
    return { kind: "skip", reason: "no-activity" };
  }

  const zeroWeek = {
    businessName: facts.businessName,
    weekRangeLabel: facts.weekRangeLabel,
    remindersSentThisWeek: facts.remindersSentThisWeek,
    autopayActiveCount: facts.autopayActiveCount,
    invoicesNowCurrent: facts.invoicesNowCurrent,
  };
  return {
    kind: "zero-week",
    sms: smsZeroWeek(zeroWeek),
    email: emailZeroWeek({ ...zeroWeek, dashboardUrl: facts.dashboardUrl }),
  };
}
