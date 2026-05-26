import "server-only";
import { formatCurrencyDetailed } from "@/lib/format";

export type ReminderTone = "polite" | "firm" | "final";

// Derive the right tone purely from days-late so the sequence is
// deterministic. Tones map roughly to weekly escalation.
export function toneForDaysLate(daysLate: number): ReminderTone | null {
  if (daysLate < 1) return null;
  if (daysLate < 7) return "polite";
  if (daysLate < 14) return "firm";
  return "final";
}

export type ReminderVars = {
  businessName: string;
  customerName: string;
  amountCents: number;
  daysLate: number;
  payUrl: string;
};

const SMS_TEMPLATES: Record<ReminderTone, (v: ReminderVars) => string> = {
  polite: (v) =>
    `Hi ${v.customerName}, friendly reminder — your ${formatCurrencyDetailed(v.amountCents)} invoice with ${v.businessName} is past due. Pay easily: ${v.payUrl}`,
  firm: (v) =>
    `${v.customerName}, your invoice of ${formatCurrencyDetailed(v.amountCents)} with ${v.businessName} is now ${v.daysLate} days overdue. Please settle today to avoid further action. Pay: ${v.payUrl}`,
  final: (v) =>
    `${v.customerName}, FINAL NOTICE: your ${formatCurrencyDetailed(v.amountCents)} invoice with ${v.businessName} is ${v.daysLate} days overdue. Settle now to avoid collections: ${v.payUrl}`,
};

const EMAIL_SUBJECT: Record<ReminderTone, (v: ReminderVars) => string> = {
  polite: (v) => `Friendly reminder from ${v.businessName}`,
  firm: (v) => `${v.daysLate}-day overdue: ${formatCurrencyDetailed(v.amountCents)} owed to ${v.businessName}`,
  final: (v) => `Final notice — ${formatCurrencyDetailed(v.amountCents)} overdue to ${v.businessName}`,
};

const EMAIL_BODY: Record<ReminderTone, (v: ReminderVars) => string> = {
  polite: (v) =>
    [
      `Hi ${v.customerName},`,
      "",
      `This is a friendly reminder that your invoice of ${formatCurrencyDetailed(v.amountCents)} with ${v.businessName} is now ${v.daysLate} day${v.daysLate === 1 ? "" : "s"} past due.`,
      "",
      "You can pay securely in two clicks here:",
      v.payUrl,
      "",
      "Please reply to this email if anything looks off.",
      "",
      "Thank you!",
    ].join("\n"),
  firm: (v) =>
    [
      `Hi ${v.customerName},`,
      "",
      `Your invoice of ${formatCurrencyDetailed(v.amountCents)} with ${v.businessName} is now ${v.daysLate} days overdue. We've reached out once already.`,
      "",
      "Please pay today to keep your account in good standing:",
      v.payUrl,
      "",
      "If there's an issue with the invoice, reply and we'll sort it out.",
      "",
      `— ${v.businessName}`,
    ].join("\n"),
  final: (v) =>
    [
      `Dear ${v.customerName},`,
      "",
      `This is a FINAL NOTICE. Your invoice of ${formatCurrencyDetailed(v.amountCents)} with ${v.businessName} is now ${v.daysLate} days overdue.`,
      "",
      "If we don't receive payment, this account may be referred to collections, which adds fees and damages credit.",
      "",
      "Pay now to avoid these consequences:",
      v.payUrl,
      "",
      "Reply immediately if you need to discuss a payment plan.",
      "",
      `— ${v.businessName}`,
    ].join("\n"),
};

export function renderSmsReminder(
  tone: ReminderTone,
  vars: ReminderVars,
): string {
  return SMS_TEMPLATES[tone](vars);
}

export function renderEmailReminder(tone: ReminderTone, vars: ReminderVars) {
  return {
    subject: EMAIL_SUBJECT[tone](vars),
    text: EMAIL_BODY[tone](vars),
  };
}
