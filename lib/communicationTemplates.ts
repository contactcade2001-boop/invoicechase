export type SmsTemplatePreset = {
  id: string;
  name: string;
  description: string;
  body: string;
};

export type EmailTemplatePreset = {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
};

// Each template is ready-to-use as-is. Owners shouldn't have to edit
// anything to start collecting — pick a tone, done.
export const SMS_TEMPLATE_PRESETS: SmsTemplatePreset[] = [
  {
    id: "friendly",
    name: "Friendly",
    description: "Warm, casual — best for repeat customers you know well.",
    body: "Hi {customer}! Quick reminder that {amount} is past due to {business}. Pay in 30 seconds: {link}",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Default — works for any business. Polite and direct.",
    body: "Hi {customer}, this is {business}. Your invoice of {amount} is past due. Settle here: {link}",
  },
  {
    id: "trades",
    name: "Field service",
    description: "Designed for trades — HVAC, plumbing, electrical, landscaping.",
    body: "Hi {customer}, this is {business}. We have {amount} outstanding from the job. Easy pay: {link}. Thanks!",
  },
  {
    id: "brief",
    name: "Brief",
    description: "Shortest possible. Stripe Click rates spike when texts fit in one preview.",
    body: "{business}: {amount} past due. Pay: {link}",
  },
  {
    id: "warm",
    name: "Warm",
    description: "Apologetic-leaning. Good for high-value customers you don't want to upset.",
    body: "Hi {customer}, sorry to ping you — {amount} is still showing as owed to {business}. If it's been paid let us know, otherwise: {link}",
  },
  {
    id: "firm",
    name: "Firm",
    description: "For repeat offenders or accounts heading to collections.",
    body: "{customer}, your {amount} balance with {business} is significantly overdue. Please pay today to avoid further action: {link}",
  },
];

export const EMAIL_TEMPLATE_PRESETS: EmailTemplatePreset[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean, standard reminder. Works for any business.",
    subject: "Invoice past due — {business}",
    body: [
      "Hi {customer},",
      "",
      "This is a friendly reminder that your invoice of {amount} with {business} is now past due.",
      "",
      "You can settle it in two clicks here:",
      "{link}",
      "",
      "If there's an issue with the invoice or you've already paid, just reply to this email and we'll take a look.",
      "",
      "Thanks,",
      "{business}",
    ].join("\n"),
  },
  {
    id: "friendly",
    name: "Friendly",
    description: "Casual + warm. Best for small businesses with personal customer relationships.",
    subject: "Hey {customer} — quick reminder",
    body: [
      "Hi {customer},",
      "",
      "Hope you're doing well! Just a quick heads-up that {amount} is showing as past due on our books.",
      "",
      "If you can pay through this link, it'll take you about a minute:",
      "{link}",
      "",
      "Or just hit reply if there's anything we need to sort out.",
      "",
      "Thanks!",
      "{business}",
    ].join("\n"),
  },
  {
    id: "trades",
    name: "Field service",
    description: "For trades — references the completed work.",
    subject: "Invoice for completed work — {amount} owed",
    body: [
      "Hi {customer},",
      "",
      "Thanks again for the work — we appreciate the business. Our records show {amount} is still outstanding from your invoice with {business}.",
      "",
      "You can pay securely here:",
      "{link}",
      "",
      "Let us know if you have any questions about the invoice or the work.",
      "",
      "— {business}",
    ].join("\n"),
  },
  {
    id: "brief",
    name: "Brief",
    description: "Minimal. Three lines and a link.",
    subject: "{amount} owed to {business}",
    body: [
      "Hi {customer},",
      "",
      "{amount} is past due. Pay here: {link}",
      "",
      "Reply with any questions.",
      "",
      "{business}",
    ].join("\n"),
  },
  {
    id: "firm",
    name: "Firm",
    description: "Direct tone for repeat offenders.",
    subject: "Action required: {amount} significantly overdue",
    body: [
      "Hi {customer},",
      "",
      "Your invoice of {amount} with {business} is significantly past due.",
      "",
      "Please pay today using the link below to keep your account in good standing and avoid any further action:",
      "{link}",
      "",
      "If you need to discuss a payment plan, reply to this email immediately.",
      "",
      "{business}",
    ].join("\n"),
  },
  {
    id: "warm",
    name: "Warm",
    description: "Apologetic-leaning. For accounts you want to preserve the relationship with.",
    subject: "Checking in on your invoice",
    body: [
      "Hi {customer},",
      "",
      "Hope I'm not catching you at a bad time. We're showing {amount} as still outstanding on your invoice with {business}.",
      "",
      "If it's already been paid and we missed it, just reply and we'll reconcile. Otherwise here's the easiest way to settle:",
      "{link}",
      "",
      "Either way, thanks for the heads up.",
      "",
      "— {business}",
    ].join("\n"),
  },
];

export function findSmsPreset(body: string): SmsTemplatePreset | null {
  return SMS_TEMPLATE_PRESETS.find((t) => t.body === body) ?? null;
}

export function findEmailPreset(body: string): EmailTemplatePreset | null {
  return EMAIL_TEMPLATE_PRESETS.find((t) => t.body === body) ?? null;
}
