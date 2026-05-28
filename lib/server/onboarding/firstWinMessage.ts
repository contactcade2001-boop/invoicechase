/**
 * Message copy for the "first win" onboarding batch. Templated so it's
 * editable here without touching the send logic. STOP language is
 * required by CTIA + 10DLC carrier rules for every campaign-style send,
 * which this batch is.
 */

export type FirstWinTokens = {
  customerName: string;
  businessName: string;
  amountDollars: string; // formatted e.g. "$1,240"
  payUrl: string;
};

const TEMPLATE =
  "Hi {customer}, quick reminder: {amount} is outstanding for {business}. Pay securely here: {link}\nReply STOP to opt out.";

export function buildFirstWinSms(tokens: FirstWinTokens): string {
  const firstName = tokens.customerName.split(/\s+/)[0] || "there";
  return TEMPLATE
    .replaceAll("{customer}", firstName)
    .replaceAll("{business}", tokens.businessName)
    .replaceAll("{amount}", tokens.amountDollars)
    .replaceAll("{link}", tokens.payUrl);
}

export function fmtUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
