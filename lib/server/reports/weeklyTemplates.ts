/**
 * Weekly retention report — message copy.
 *
 * Pure functions, no DB / no server-only. To change the copy: edit the
 * strings here. The builder fills these in with real numbers; the
 * scheduler picks which template to use based on the week's activity.
 */

export type StandardReport = {
  businessName: string;
  weekRangeLabel: string; // e.g. "Mar 18 – Mar 24"
  totalCollectedDollars: number;
  paidInvoiceCount: number;
  baselineDsoDays: number | null;
  currentDsoDays: number;
  attributedDollars: number; // subset of total that followed a reminder
};

export type ZeroWeekReport = {
  businessName: string;
  weekRangeLabel: string;
  remindersSentThisWeek: number;
  autopayActiveCount: number;
  invoicesNowCurrent: number;
};

function fmtDollars(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function plural(n: number, singular: string, pluralForm?: string): string {
  return n === 1 ? singular : (pluralForm ?? `${singular}s`);
}

/* ───────────── SMS templates ───────────── */

export function smsStandard(r: StandardReport): string {
  const total = fmtDollars(r.totalCollectedDollars);
  const headline = `Invoice Chase collected ${total} across ${r.paidInvoiceCount} ${plural(r.paidInvoiceCount, "invoice")} this week.`;
  const dso =
    r.baselineDsoDays != null && r.baselineDsoDays > r.currentDsoDays
      ? ` Your average pay time dropped from ${r.baselineDsoDays} to ${r.currentDsoDays} days.`
      : ` Current average pay time: ${r.currentDsoDays} days.`;
  return headline + dso;
}

export function smsZeroWeek(r: ZeroWeekReport): string {
  // Reinforce we're working in the background. Short, no $0.
  if (r.remindersSentThisWeek === 0 && r.autopayActiveCount === 0) {
    // Truly nothing to report — caller decides to skip vs. send.
    return `Invoice Chase: nothing collected this week, no reminders sent. Pop into the dashboard if you want to kick things off.`;
  }
  const parts: string[] = [];
  if (r.remindersSentThisWeek > 0) {
    parts.push(
      `${r.remindersSentThisWeek} ${plural(r.remindersSentThisWeek, "reminder")} sent`,
    );
  }
  if (r.autopayActiveCount > 0) {
    parts.push(
      `${r.autopayActiveCount} ${plural(r.autopayActiveCount, "customer")} on autopay`,
    );
  }
  if (r.invoicesNowCurrent > 0) {
    parts.push(
      `${r.invoicesNowCurrent} ${plural(r.invoicesNowCurrent, "invoice")} now current`,
    );
  }
  return `Invoice Chase update: no new payments this week, but ${parts.join(" · ")}. We'll keep at it.`;
}

/* ───────────── Email templates ───────────── */

export type EmailLineItem = {
  customerName: string;
  amountDollars: number;
  daysToPayment: number;
  attributed: boolean;
};

export type StandardEmail = StandardReport & {
  items: EmailLineItem[];
  dashboardUrl: string;
};

export function emailStandard(r: StandardEmail): {
  subject: string;
  text: string;
  html: string;
} {
  const total = fmtDollars(r.totalCollectedDollars);
  const attributedPct =
    r.totalCollectedDollars > 0
      ? Math.round((r.attributedDollars / r.totalCollectedDollars) * 100)
      : 0;
  const subject = `Invoice Chase · ${total} collected this week for ${r.businessName}`;

  const dsoLine =
    r.baselineDsoDays != null && r.baselineDsoDays > r.currentDsoDays
      ? `Your average pay time dropped from ${r.baselineDsoDays} to ${r.currentDsoDays} days since you connected.`
      : r.baselineDsoDays != null
        ? `Your current average pay time is ${r.currentDsoDays} days (baseline ${r.baselineDsoDays}).`
        : `Your current average pay time is ${r.currentDsoDays} days.`;

  const itemsText = r.items
    .map(
      (i) =>
        `  · ${i.customerName} — ${fmtDollars(i.amountDollars)} (${i.daysToPayment}d)${i.attributed ? " ★" : ""}`,
    )
    .join("\n");

  const text = [
    `Here's what Invoice Chase did this week for ${r.businessName} (${r.weekRangeLabel}):`,
    ``,
    `${total} collected across ${r.paidInvoiceCount} ${plural(r.paidInvoiceCount, "invoice")}.`,
    `${attributedPct}% of that landed after a reminder we sent.`,
    ``,
    `Paid this week:`,
    itemsText || "  (no itemized data available)",
    ``,
    dsoLine,
    ``,
    `Open dashboard: ${r.dashboardUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1c1917">
      <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#c2410c;font-weight:600">Weekly report · ${r.weekRangeLabel}</p>
      <h1 style="font-size:24px;margin:8px 0 0;color:#1c1917;line-height:1.2">${total} collected this week</h1>
      <p style="font-size:14px;color:#57534e;margin:8px 0 24px">${r.paidInvoiceCount} ${plural(r.paidInvoiceCount, "invoice")} paid · ${attributedPct}% landed after a reminder</p>

      <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#78716c;font-weight:600">Paid this week</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0 4px;margin-bottom:24px">
        ${r.items
          .map(
            (i) => `
          <tr>
            <td style="background:#fafaf9;border-radius:8px;padding:10px 12px;font-size:13px;color:#1c1917">
              <strong>${i.customerName}</strong>
              ${i.attributed ? '<span style="margin-left:6px;font-size:10px;color:#c2410c;font-weight:600">★ attributed</span>' : ""}
              <div style="margin-top:2px;color:#78716c;font-size:12px">${fmtDollars(i.amountDollars)} · ${i.daysToPayment} days to pay</div>
            </td>
          </tr>`,
          )
          .join("")}
      </table>

      <div style="background:#fff7ed;border-radius:12px;padding:14px 16px;margin-bottom:24px">
        <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#c2410c;font-weight:600">DSO</p>
        <p style="margin:6px 0 0;font-size:14px;color:#1c1917">${dsoLine}</p>
      </div>

      <p style="text-align:center;margin:24px 0">
        <a href="${r.dashboardUrl}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:13px">Open dashboard</a>
      </p>
      <p style="margin:16px 0 0;font-size:11px;color:#a8a29e;text-align:center">Weekly report ★ = paid after a reminder we sent. Turn this off in Settings any time.</p>
    </div>`;

  return { subject, text, html };
}

export function emailZeroWeek(r: ZeroWeekReport & { dashboardUrl: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Invoice Chase · ${r.businessName} — quiet week, here's what's working`;
  const bullets = [
    r.remindersSentThisWeek > 0
      ? `${r.remindersSentThisWeek} reminders sent`
      : null,
    r.autopayActiveCount > 0
      ? `${r.autopayActiveCount} customers on autopay`
      : null,
    r.invoicesNowCurrent > 0
      ? `${r.invoicesNowCurrent} invoices now current`
      : null,
  ].filter(Boolean) as string[];

  const text = [
    `No new payments came in this week for ${r.businessName} (${r.weekRangeLabel}), but here's what we did in the background:`,
    ``,
    ...bullets.map((b) => `  · ${b}`),
    ``,
    `Open dashboard: ${r.dashboardUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1c1917">
      <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#c2410c;font-weight:600">Weekly update · ${r.weekRangeLabel}</p>
      <h1 style="font-size:20px;margin:8px 0 16px">Quiet week — but we kept working</h1>
      <ul style="margin:0 0 24px;padding-left:18px;font-size:14px;color:#57534e;line-height:1.7">
        ${bullets.map((b) => `<li>${b}</li>`).join("")}
      </ul>
      <p style="text-align:center;margin:24px 0">
        <a href="${r.dashboardUrl}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:13px">Open dashboard</a>
      </p>
    </div>`;

  return { subject, text, html };
}
