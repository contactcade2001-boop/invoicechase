import "server-only";
import type { Customer } from "@/lib/types";

export type DailyDigest = {
  collectedYesterdayCents: number;
  paymentsYesterdayCount: number;
  overdueTodayCount: number;
  overdueTodayCents: number;
  newCustomersCount: number;
  topPriority:
    | {
        customerId: string;
        customerName: string;
        amountOwed: number;
        daysLate: number;
      }
    | null;
  aiRepliesOvernight: number;
  /** A short Markdown / plain-text body suitable for email. */
  textBody: string;
  /** Same content in HTML for the Resend email. */
  htmlBody: string;
  subject: string;
};

type DigestInputs = {
  businessName: string;
  customers: Customer[];
  collectedYesterdayCents?: number;
  paymentsYesterdayCount?: number;
  newCustomersCount?: number;
  aiRepliesOvernight?: number;
};

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function buildDailyDigest(input: DigestInputs): DailyDigest {
  const overdue = input.customers.filter(
    (c) => c.daysLate > 0 && c.amountOwed > 0,
  );
  const overdueTodayCents = overdue.reduce((s, c) => s + c.amountOwed, 0);

  const topPriority =
    overdue.length === 0
      ? null
      : [...overdue].sort(
          (a, b) =>
            (850 - a.reputationScore) * a.amountOwed -
            (850 - b.reputationScore) * b.amountOwed,
        )[overdue.length - 1];

  const collected = input.collectedYesterdayCents ?? 0;
  const paymentsCount = input.paymentsYesterdayCount ?? 0;
  const newCustomers = input.newCustomersCount ?? 0;
  const aiReplies = input.aiRepliesOvernight ?? 0;

  const subject = `Invoice Chase · ${input.businessName} · ${formatCurrency(collected)} collected yesterday`;

  const top =
    topPriority &&
    `${topPriority.name} owes ${formatCurrency(topPriority.amountOwed)} (${topPriority.daysLate}d late)`;

  const textBody = [
    `Good morning. Here's your 24-hour AR snapshot for ${input.businessName}.`,
    ``,
    `💰 Collected yesterday: ${formatCurrency(collected)} (${paymentsCount} payments)`,
    `⏰ Overdue today: ${overdue.length} customer${overdue.length === 1 ? "" : "s"} · ${formatCurrency(overdueTodayCents)}`,
    `🤖 Claude AI replies overnight: ${aiReplies}`,
    `🆕 New customers synced: ${newCustomers}`,
    ``,
    top ? `Top priority today: ${top}.` : `Everyone's current. Take the win.`,
    ``,
    `Open dashboard: https://invoicechase.com/dashboard`,
  ].join("\n");

  const htmlBody = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1c1917">
      <h1 style="font-size:18px;margin:0 0 8px;color:#1c1917">Good morning — your AR snapshot</h1>
      <p style="font-size:13px;color:#78716c;margin:0 0 24px">${input.businessName} · last 24 hours</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0 8px">
        <tr>
          <td style="background:#fff7ed;border-radius:12px;padding:14px 16px">
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9a3412;font-weight:600">Collected yesterday</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#1c1917">${formatCurrency(collected)} <span style="font-size:12px;color:#78716c;font-weight:400">· ${paymentsCount} payments</span></p>
          </td>
        </tr>
        <tr>
          <td style="background:#fef3c7;border-radius:12px;padding:14px 16px">
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#92400e;font-weight:600">Overdue today</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#1c1917">${overdue.length} <span style="font-size:12px;color:#78716c;font-weight:400">· ${formatCurrency(overdueTodayCents)}</span></p>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f5f4;border-radius:12px;padding:14px 16px">
            <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#57534e;font-weight:600">Overnight AI replies</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:#1c1917">${aiReplies}</p>
          </td>
        </tr>
      </table>
      ${
        top
          ? `<div style="margin-top:18px;background:#fff;border:1px solid #e7e5e4;border-radius:12px;padding:14px 16px">
              <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#78716c;font-weight:600">Top priority today</p>
              <p style="margin:4px 0 0;font-size:15px;color:#1c1917"><strong>${top}</strong></p>
            </div>`
          : ""
      }
      <p style="margin-top:24px;text-align:center">
        <a href="https://invoicechase.com/dashboard" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:13px">Open dashboard</a>
      </p>
      <p style="margin-top:16px;font-size:11px;color:#a8a29e;text-align:center">You're getting this because daily digests are on. Turn off in Settings.</p>
    </div>`;

  return {
    collectedYesterdayCents: collected,
    paymentsYesterdayCount: paymentsCount,
    overdueTodayCount: overdue.length,
    overdueTodayCents,
    newCustomersCount: newCustomers,
    topPriority: topPriority
      ? {
          customerId: topPriority.id,
          customerName: topPriority.name,
          amountOwed: topPriority.amountOwed,
          daysLate: topPriority.daysLate,
        }
      : null,
    aiRepliesOvernight: aiReplies,
    textBody,
    htmlBody,
    subject,
  };
}
