import "server-only";
import { sendEmail } from "./resend";
import { getAppBaseUrl } from "../env";

export type WelcomeEmailInput = {
  to: string;
  displayName: string | null;
  referralCode: string;
};

export async function sendPartnerWelcomeEmail(
  input: WelcomeEmailInput,
): Promise<{ delivered: boolean }> {
  const link = `${getAppBaseUrl()}/r/${input.referralCode}`;
  const dashboard = `${getAppBaseUrl()}/partner`;
  const greeting = input.displayName ? `Hi ${input.displayName},` : "Hi,";

  const text = [
    greeting,
    "",
    "Welcome to the Invoice Chase Partner Program. You earn 20% recurring commission on every Invoice Chase subscription you refer — for as long as the customer stays subscribed.",
    "",
    `Your referral link: ${link}`,
    `Your partner dashboard: ${dashboard}`,
    "",
    "How it works:",
    "1. Share your link with QuickBooks-using SMBs you work with.",
    "2. When they sign up and start a subscription, the referral attaches to your account.",
    "3. We pay 20% of their $49/month plus 20% of any platform fees they pay us, on a monthly cycle.",
    "",
    "Quick wins:",
    "- Add the link to your client onboarding emails",
    "- Mention it during your monthly check-ins with bookkeeping clients",
    "- Drop the one-pager at /partners into your firm's resource folder",
    "",
    "Reply to this email with any questions.",
    "",
    "— Invoice Chase",
  ].join("\n");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a">
      <h1 style="font-size:22px;margin:0 0 8px">Welcome to the Invoice Chase Partner Program</h1>
      <p style="font-size:14px;line-height:1.5;color:#475569;margin:0 0 16px">${greeting}</p>
      <p style="font-size:14px;line-height:1.5;color:#475569;margin:0 0 16px">
        You earn <strong>20% recurring commission</strong> on every Invoice Chase subscription you refer —
        for as long as the customer stays subscribed.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 24px">
        <tbody>
          <tr>
            <td style="padding:6px 0;color:#475569;width:140px">Your referral link</td>
            <td style="padding:6px 0;font-family:ui-monospace,monospace;font-size:13px"><a href="${link}" style="color:#0f172a">${link}</a></td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569">Partner dashboard</td>
            <td style="padding:6px 0"><a href="${dashboard}" style="color:#0f172a">${dashboard}</a></td>
          </tr>
        </tbody>
      </table>
      <h2 style="font-size:16px;margin:0 0 8px">How it works</h2>
      <ol style="font-size:14px;line-height:1.6;color:#475569;padding-left:20px;margin:0 0 16px">
        <li>Share your link with QuickBooks-using SMBs you work with.</li>
        <li>When they sign up and start a subscription, the referral attaches to your account.</li>
        <li>We pay 20% of their $49/month plus 20% of any platform fees they pay us, on a monthly cycle.</li>
      </ol>
      <h2 style="font-size:16px;margin:0 0 8px">Quick wins</h2>
      <ul style="font-size:14px;line-height:1.6;color:#475569;padding-left:20px;margin:0 0 16px">
        <li>Add the link to your client onboarding emails</li>
        <li>Mention it during your monthly check-ins with bookkeeping clients</li>
        <li>Drop the one-pager at <a href="${getAppBaseUrl()}/partners" style="color:#0f172a">/partners</a> into your firm&rsquo;s resource folder</li>
      </ul>
      <p style="font-size:13px;line-height:1.5;color:#94a3b8;margin:24px 0 0">Reply to this email with any questions.</p>
    </div>
  `.trim();

  const result = await sendEmail({
    to: input.to,
    subject: "Welcome to the Invoice Chase Partner Program",
    text,
    html,
  });
  return { delivered: result.delivered };
}
