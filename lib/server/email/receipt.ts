import "server-only";
import { formatCurrencyDetailed } from "@/lib/format";
import { getAppBaseUrl } from "../env";
import { sendEmail } from "./resend";

export type ReceiptInput = {
  to: string;
  businessName: string;
  customerName: string | null;
  amountCents: number;
  paidAtMs: number;
  reference: string; // short charge / payment intent identifier
  portalSlug?: string | null;
  logoUrl?: string | null;
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function sendReceiptEmail(
  input: ReceiptInput,
): Promise<{ delivered: boolean }> {
  const amount = formatCurrencyDetailed(input.amountCents);
  const subject = `Payment received from ${input.businessName}`;
  const portalUrl = input.portalSlug
    ? `${getAppBaseUrl()}/p/${input.portalSlug}`
    : `${getAppBaseUrl()}/portal`;

  const text = [
    `Thanks${input.customerName ? `, ${input.customerName}` : ""}.`,
    "",
    `${input.businessName} received your payment of ${amount} on ${formatDate(input.paidAtMs)}.`,
    "",
    `Reference: ${input.reference}`,
    "",
    `View this and your past payments: ${portalUrl}`,
    "",
    `Questions? Reply to this email and ${input.businessName} will get back to you.`,
  ].join("\n");

  const logoBlock = input.logoUrl
    ? `<img src="${escapeHtml(input.logoUrl)}" alt="${escapeHtml(input.businessName)}" style="height:32px;width:auto;margin:0 0 16px" />`
    : "";
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a">
      ${logoBlock}
      <p style="font-size:14px;color:#475569;margin:0 0 16px">Receipt</p>
      <h1 style="font-size:22px;margin:0 0 8px">${escapeHtml(input.businessName)} received ${escapeHtml(amount)}</h1>
      <p style="font-size:14px;line-height:1.5;color:#475569;margin:0 0 20px">
        Thanks${input.customerName ? `, ${escapeHtml(input.customerName)}` : ""}. Your payment was processed on ${formatDate(input.paidAtMs)}.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 24px">
        <tbody>
          <tr>
            <td style="padding:6px 0;color:#475569">Amount</td>
            <td style="padding:6px 0;text-align:right;font-weight:600">${escapeHtml(amount)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569">Date</td>
            <td style="padding:6px 0;text-align:right">${formatDate(input.paidAtMs)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569">Reference</td>
            <td style="padding:6px 0;text-align:right;font-family:ui-monospace,monospace;font-size:12px">${escapeHtml(input.reference)}</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size:13px;line-height:1.5;color:#475569;margin:0 0 16px">
        <a href="${portalUrl}" style="color:#0f172a;font-weight:600">View this and your past payments →</a>
      </p>
      <p style="font-size:12px;color:#94a3b8;line-height:1.5">
        Questions about this payment? Reply directly to this email and ${escapeHtml(input.businessName)} will get back to you.
      </p>
    </div>
  `.trim();

  const result = await sendEmail({ to: input.to, subject, text, html });
  return { delivered: result.delivered };
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
