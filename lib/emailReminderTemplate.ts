import { formatCurrencyDetailed } from "./format";

export const DEFAULT_EMAIL_SUBJECT = "Friendly reminder from {business}";
export const DEFAULT_EMAIL_BODY = [
  "Hi {customer},",
  "",
  "{business} shows an open balance of {amount}. You can pay securely here:",
  "{link}",
  "",
  "Reply to this email if you have any questions.",
  "",
  "Thank you!",
].join("\n");

export type EmailReminderTokens = {
  amount: string;
  link: string;
  customer: string;
  business: string;
};

export function renderEmailReminder(
  template: { subject: string | null; body: string | null } | null,
  vars: {
    amountCents: number;
    payUrl: string;
    customerName: string;
    businessName: string;
  },
): { subject: string; text: string; html: string } {
  const tokens: EmailReminderTokens = {
    amount: formatCurrencyDetailed(vars.amountCents),
    link: vars.payUrl,
    customer: vars.customerName,
    business: vars.businessName,
  };
  const subject = substitute(
    template?.subject?.trim() ? template.subject : DEFAULT_EMAIL_SUBJECT,
    tokens,
  );
  const text = substitute(
    template?.body?.trim() ? template.body : DEFAULT_EMAIL_BODY,
    tokens,
  );
  // Minimal HTML: paragraph wrap each line, link the URL.
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a;font-size:14px;line-height:1.6">${text
    .split(/\n+/)
    .map((line) => {
      if (line.trim() === "") return "";
      const linked = line.replace(
        /(https?:\/\/[^\s)]+)/g,
        '<a href="$1" style="color:#0f172a;font-weight:600">$1</a>',
      );
      return `<p style="margin:0 0 12px">${escapeHtml(linked, true)}</p>`;
    })
    .join("")}</div>`;
  return { subject, text, html };
}

function substitute(template: string, tokens: EmailReminderTokens): string {
  return template
    .replaceAll("{amount}", tokens.amount)
    .replaceAll("{link}", tokens.link)
    .replaceAll("{customer}", tokens.customer)
    .replaceAll("{business}", tokens.business);
}

// Tiny escaper that only touches characters dangerous in body context;
// preserves the anchor tags we just inserted for the {link} token.
function escapeHtml(s: string, allowAnchorTags: boolean): string {
  if (!allowAnchorTags) {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
  // Walk the string, leaving <a ...> ... </a> sections alone, escaping
  // everything else.
  const out: string[] = [];
  const tagRegex = /<a [^>]+>.*?<\/a>/g;
  let last = 0;
  for (const m of s.matchAll(tagRegex)) {
    out.push(escapeHtml(s.slice(last, m.index), false));
    out.push(m[0]);
    last = (m.index ?? 0) + m[0].length;
  }
  out.push(escapeHtml(s.slice(last), false));
  return out.join("");
}
