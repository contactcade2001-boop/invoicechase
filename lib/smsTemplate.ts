import { formatCurrencyDetailed } from "./format";

export const DEFAULT_SMS_TEMPLATE = "Pay {amount} now: {link}";

export const SMS_PLACEHOLDERS = [
  { token: "{amount}", description: "Amount due, e.g. $4,200.00" },
  { token: "{link}", description: "Stripe payment link" },
  { token: "{customer}", description: "Customer name" },
  { token: "{business}", description: "Your business name" },
];

export type SmsTokens = {
  amount: string;
  link: string;
  customer: string;
  business: string;
};

export function substituteSmsTokens(
  template: string | null | undefined,
  tokens: SmsTokens,
): string {
  const t = template?.trim() ? template : DEFAULT_SMS_TEMPLATE;
  return t
    .replaceAll("{amount}", tokens.amount)
    .replaceAll("{link}", tokens.link)
    .replaceAll("{customer}", tokens.customer)
    .replaceAll("{business}", tokens.business);
}

export function renderSmsBody(
  template: string | null | undefined,
  vars: {
    amountCents: number;
    payUrl: string;
    customerName: string;
    businessName: string;
  },
): string {
  return substituteSmsTokens(template, {
    amount: formatCurrencyDetailed(vars.amountCents),
    link: vars.payUrl,
    customer: vars.customerName,
    business: vars.businessName,
  });
}
