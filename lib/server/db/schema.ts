import "server-only";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const customerMetadata = sqliteTable(
  "customer_metadata",
  {
    organizationId: integer("organization_id").notNull(),
    customerId: text("customer_id").notNull(),
    note: text("note"),
    snoozedUntil: integer("snoozed_until"),
    tags: text("tags"),
    /** Per-customer tone override: "gentle" | "neutral" | "firm". */
    tone: text("tone"),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.customerId] })],
);

export const onboardingState = sqliteTable("onboarding_state", {
  organizationId: integer("organization_id").primaryKey(),
  completed: integer("completed").notNull().default(0),
  businessName: text("business_name"),
  industry: text("industry"),
  accentColor: text("accent_color"),
  preferredIntegration: text("preferred_integration"),
  updatedAt: integer("updated_at").notNull(),
});

export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  ownerUserId: integer("owner_user_id").notNull(),
  autopilotEnabled: integer("autopilot_enabled").notNull().default(0),
  depositEnabled: integer("deposit_enabled").notNull().default(0),
  depositPercentBps: integer("deposit_percent_bps").notNull().default(5000),
  depositThresholdScore: integer("deposit_threshold_score").notNull().default(580),
  customReceiptsEnabled: integer("custom_receipts_enabled").notNull().default(0),
  qboDepositToAccountId: text("qbo_deposit_to_account_id"),
  qboRefundAccountId: text("qbo_refund_account_id"),
  qboRefundItemId: text("qbo_refund_item_id"),
  portalSlug: text("portal_slug").unique(),
  portalAccentColor: text("portal_accent_color"),
  digestPhone: text("digest_phone"),
  twilioPhoneNumber: text("twilio_phone_number"),
  lastDigestAt: integer("last_digest_at"),
  lastDepositPollAt: integer("last_deposit_poll_at"),
  lastInvoiceCdcAt: integer("last_invoice_cdc_at"),
  logoUrl: text("logo_url"),
  customerReferralCode: text("customer_referral_code"),
  referredByOrgId: integer("referred_by_org_id"),
  reminderSequencesEnabled: integer("reminder_sequences_enabled").notNull().default(0),
  cashflowMonthlyOutflowCents: integer("cashflow_monthly_outflow_cents").notNull().default(0),
  cashflowMonthlyNewInvoicesCents: integer("cashflow_monthly_new_invoices_cents").notNull().default(0),
  // ── Cashflow lift settings ──────────────────────────────────────────
  /** 200 = 2.00% off if paid within the early window. 0 = disabled. */
  earlyPayDiscountBps: integer("early_pay_discount_bps").notNull().default(0),
  /** Number of days from invoice issue to qualify for the early-pay discount. */
  earlyPayDays: integer("early_pay_days").notNull().default(7),
  /** Discount in bps for paying via ACH instead of card. 0 = disabled. */
  achDiscountBps: integer("ach_discount_bps").notNull().default(0),
  /** Monthly late-fee in bps. 150 = 1.5%/month. 0 = disabled. */
  lateFeeBps: integer("late_fee_bps").notNull().default(0),
  /** Days past due before the fee starts accruing. */
  lateFeeStartDays: integer("late_fee_start_days").notNull().default(30),
  /** Send a pre-due reminder N days before the invoice is due. 0 = off. */
  preDueReminderDays: integer("pre_due_reminder_days").notNull().default(0),
  /** Smart-send: time-of-day matching using customer reply history. */
  smartSendTimesEnabled: integer("smart_send_times_enabled").notNull().default(0),
  /** Last-known bank balance in cents (from Plaid or manual). */
  bankBalanceCents: integer("bank_balance_cents"),
  /** UNIX ms when bankBalanceCents was last refreshed. */
  bankBalanceRefreshedAt: integer("bank_balance_refreshed_at"),
  /** Plaid item id if connected, null otherwise. */
  plaidItemId: text("plaid_item_id"),
  /** Encrypted Plaid access_token (long-lived). */
  plaidAccessTokenEnc: text("plaid_access_token_enc"),
  /** Display name for the connected institution (e.g. "Chase Personal"). */
  plaidInstitutionName: text("plaid_institution_name"),
  /** Org-wide pause for seasonal slowdowns. Affects all autopilot sends. */
  seasonalPauseUntil: integer("seasonal_pause_until"),
  /** Require owner approval before any AI-drafted message is sent. */
  approvalQueueEnabled: integer("approval_queue_enabled").notNull().default(0),
  /** Auto-send thank-you SMS when a payment is received. */
  thankYouOnPaymentEnabled: integer("thank_you_on_payment_enabled").notNull().default(1),
  /** Auto-send review request after payment (Google/Yelp/etc). */
  reviewRequestEnabled: integer("review_request_enabled").notNull().default(0),
  /** Public review URL (Google Maps / Yelp). */
  reviewRequestUrl: text("review_request_url"),
  /** Weekly retention report toggle (SMS + email). Default on. */
  weeklyReportEnabled: integer("weekly_report_enabled").notNull().default(1),
  /** Day-of-week to deliver weekly report (0=Sun..6=Sat). Default Fri. */
  weeklyReportDow: integer("weekly_report_dow").notNull().default(5),
  /** Local hour-of-day to deliver weekly report (0-23). Default 9am. */
  weeklyReportHour: integer("weekly_report_hour").notNull().default(9),
  /** IANA timezone string, e.g. "America/New_York". Drives weekly report
   *  + future per-org scheduling. */
  timezone: text("timezone").notNull().default("America/New_York"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const settlementOffers = sqliteTable("settlement_offers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name"),
  originalBalanceCents: integer("original_balance_cents").notNull(),
  offerBalanceCents: integer("offer_balance_cents").notNull(),
  /** Hours from creation for the offer to remain open. */
  expiresInHours: integer("expires_in_hours").notNull().default(48),
  expiresAt: integer("expires_at").notNull(),
  status: text("status").notNull().default("sent"),
  acceptedAt: integer("accepted_at"),
  declinedAt: integer("declined_at"),
  paidAt: integer("paid_at"),
  payLinkId: integer("pay_link_id"),
  createdAt: integer("created_at").notNull(),
});

export const mechanicsLiens = sqliteTable("mechanics_liens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name"),
  jobAddress: text("job_address"),
  /** Two-letter US state code (e.g. "TX"). Drives deadline math. */
  state: text("state").notNull(),
  invoiceAmountCents: integer("invoice_amount_cents").notNull(),
  /** Last day work was performed or materials delivered. */
  lastFurnishDate: integer("last_furnish_date").notNull(),
  /** Auto-computed: lastFurnishDate + per-state window. */
  filingDeadline: integer("filing_deadline").notNull(),
  /** Days before the deadline to remind the owner. */
  reminderDays: integer("reminder_days").notNull().default(30),
  status: text("status").notNull().default("tracking"),
  resolvedAt: integer("resolved_at"),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
});

export const approvalQueue = sqliteTable("approval_queue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name"),
  channel: text("channel").notNull(),
  draftBody: text("draft_body").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  approvedAt: integer("approved_at"),
  approvedByUserId: integer("approved_by_user_id"),
  declinedAt: integer("declined_at"),
  sentAt: integer("sent_at"),
  createdAt: integer("created_at").notNull(),
});

export const templateStats = sqliteTable(
  "template_stats",
  {
    organizationId: integer("organization_id").notNull(),
    templateKey: text("template_key").notNull(),
    sends: integer("sends").notNull().default(0),
    replies: integer("replies").notNull().default(0),
    paid: integer("paid").notNull().default(0),
    paidCents: integer("paid_cents").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.templateKey] })],
);

export const autopayMethods = sqliteTable(
  "autopay_methods",
  {
    organizationId: integer("organization_id").notNull(),
    customerId: text("customer_id").notNull(),
    /** Email used at enrollment — also the Stripe customer identifier. */
    customerEmail: text("customer_email").notNull(),
    /** Stripe Customer id on the connected account. */
    stripeCustomerId: text("stripe_customer_id").notNull(),
    /** PaymentMethod id saved via SetupIntent — used for off-session charges. */
    stripePaymentMethodId: text("stripe_payment_method_id").notNull(),
    /** Card brand for display ("visa", "mastercard", "amex", "ach"). */
    brand: text("brand"),
    last4: text("last4"),
    /** When the customer confirmed the autopay agreement. */
    enrolledAt: integer("enrolled_at").notNull(),
    /** Owner can disable without the customer removing the saved method. */
    paused: integer("paused").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.organizationId, t.customerId] })],
);

export const jobPhotos = sqliteTable("job_photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  invoiceId: text("invoice_id"),
  /** Absolute file path on the Fly volume. */
  filePath: text("file_path").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  caption: text("caption"),
  uploadedByUserId: integer("uploaded_by_user_id"),
  createdAt: integer("created_at").notNull(),
});

export const scheduledAppointments = sqliteTable("scheduled_appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  scheduledFor: integer("scheduled_for").notNull(),
  description: text("description"),
  reminderDaysBefore: integer("reminder_days_before").notNull().default(3),
  reminderSentAt: integer("reminder_sent_at"),
  status: text("status").notNull().default("scheduled"),
  createdAt: integer("created_at").notNull(),
});

export const customerSendPrefs = sqliteTable("customer_send_prefs", {
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  /** Best hour-of-day (0-23) to text this customer. Computed from history. */
  bestHourUtc: integer("best_hour_utc"),
  /** Best day-of-week (0=Sun..6=Sat). */
  bestDow: integer("best_dow"),
  /** Sample size used. */
  sampleN: integer("sample_n").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
}, (t) => [primaryKey({ columns: [t.organizationId, t.customerId] })]);

export const smsConversations = sqliteTable("sms_conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id"),
  customerPhone: text("customer_phone").notNull(),
  customerName: text("customer_name"),
  autopilotPaused: integer("autopilot_paused").notNull().default(0),
  lastMessageAt: integer("last_message_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const smsMessages = sqliteTable("sms_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").notNull(),
  direction: text("direction").notNull(),
  body: text("body").notNull(),
  twilioSid: text("twilio_sid"),
  autopilot: integer("autopilot").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const rateLimitEvents = sqliteTable("rate_limit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bucket: text("bucket").notNull(),
  hitAt: integer("hit_at").notNull(),
});

export const inboxReads = sqliteTable("inbox_reads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  conversationId: integer("conversation_id").notNull(),
  lastReadAt: integer("last_read_at").notNull(),
});

export const customerSessions = sqliteTable("customer_sessions", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const smsOptOuts = sqliteTable("sms_opt_outs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  phone: text("phone").notNull(),
  reason: text("reason"),
  createdAt: integer("created_at").notNull(),
});

export const customerMagicLinks = sqliteTable("customer_magic_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at").notNull(),
  usedAt: integer("used_at"),
  createdAt: integer("created_at").notNull(),
});

export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  userId: integer("user_id"),
  actorEmail: text("actor_email"),
  kind: text("kind").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  metadataJson: text("metadata_json"),
  createdAt: integer("created_at").notNull(),
});

export const webhookEvents = sqliteTable("webhook_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(),
  organizationId: integer("organization_id"),
  eventId: text("event_id"),
  type: text("type"),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  payloadDigest: text("payload_digest"),
  createdAt: integer("created_at").notNull(),
});

export const organizationInvites = sqliteTable("organization_invites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at").notNull(),
  usedAt: integer("used_at"),
  createdAt: integer("created_at").notNull(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  emailVerifiedAt: integer("email_verified_at"),
  smsTemplate: text("sms_template"),
  emailReminderTemplate: text("email_reminder_template"),
  ownerPhone: text("owner_phone"),
  organizationId: integer("organization_id"),
  role: text("role").notNull().default("owner"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const magicLinks = sqliteTable("magic_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at").notNull(),
  usedAt: integer("used_at"),
  createdAt: integer("created_at").notNull(),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  status: text("status"),
  currentPeriodEnd: integer("current_period_end"),
  cancelAtPeriodEnd: integer("cancel_at_period_end").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const stripeConnectAccounts = sqliteTable("stripe_connect_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull().unique(),
  stripeAccountId: text("stripe_account_id").notNull().unique(),
  chargesEnabled: integer("charges_enabled").notNull().default(0),
  payoutsEnabled: integer("payouts_enabled").notNull().default(0),
  detailsSubmitted: integer("details_submitted").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const payLinks = sqliteTable("pay_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  amountCentsOverride: integer("amount_cents_override"),
  viewedAt: integer("viewed_at"),
  viewedCount: integer("viewed_count").notNull().default(0),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const reminderSends = sqliteTable("reminder_sends", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  tone: text("tone").notNull(),
  channel: text("channel").notNull(),
  sentAt: integer("sent_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

/**
 * One row per invoice we've observed paid. Sourced from QBO/Xero/Jobber
 * payment + invoice records. Used to compute DSO (paid_at − issued_at).
 * If a payment plan splits an invoice, we record one row per installment
 * paid so the median/mean reflects actual cash dates.
 */
export const paidInvoices = sqliteTable("paid_invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  /** Source-system invoice id (QBO Id, Xero invoiceId, etc.). */
  sourceInvoiceId: text("source_invoice_id").notNull(),
  /** Optional installment marker so the same invoice can have N rows. */
  installmentNumber: integer("installment_number").notNull().default(1),
  /** "qbo" | "xero" | "jobber" | "stripe" — used so we can dedupe per source. */
  source: text("source").notNull(),
  /** When the invoice was originally issued (cents-accurate to TxnDate). */
  issuedAt: integer("issued_at").notNull(),
  /** When this slice of the invoice was actually paid. */
  paidAt: integer("paid_at").notNull(),
  /** Days late = paidAt − dueAt; null when invoice didn't have a due date. */
  daysToPayment: integer("days_to_payment").notNull(),
  /** Cents collected on this row (the slice, not the total invoice). */
  amountCents: integer("amount_cents").notNull(),
  /** Reminder id that preceded this payment by ≤14d, if any. Powers
   *  attributed-collections reporting ("we collected this"). */
  attributedReminderId: integer("attributed_reminder_id"),
  /** Was an AI autopilot reply sent in the conversation before payment? */
  attributedAiReplyAt: integer("attributed_ai_reply_at"),
  createdAt: integer("created_at").notNull(),
});

/**
 * One row per (organization, week) so we never double-send the weekly
 * retention report. weekKey is "YYYY-Www" computed in the owner's local
 * timezone. Stores delivery timestamps separately so we can retry SMS
 * even if email already succeeded (and vice versa).
 */
export const weeklyReportSends = sqliteTable("weekly_report_sends", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  weekKey: text("week_key").notNull(),
  smsSentAt: integer("sms_sent_at"),
  emailSentAt: integer("email_sent_at"),
  /** "no-collections" | "owner-disabled" | "no-contact" | etc. when we
   *  intentionally didn't send the standard report. */
  skippedReason: text("skipped_reason"),
  /** Total cents reported in the message, for ops auditing. */
  totalCollectedCents: integer("total_collected_cents").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

/**
 * Snapshots of an organization's DSO over time. The first row per org is
 * the baseline (captured on connect). Subsequent rows are periodic
 * roll-ups so we can chart trend.
 */
export const dsoSnapshots = sqliteTable("dso_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  /** "baseline" (one per org) | "rolling" (periodic). */
  kind: text("kind").notNull(),
  /** Trailing window in days the snapshot covers (e.g. 30, 90). */
  windowDays: integer("window_days").notNull(),
  /** Mean days from issue to payment. */
  dsoDays: integer("dso_days").notNull(),
  /** Sample size used in the calc. */
  paidInvoiceCount: integer("paid_invoice_count").notNull(),
  /** Total cents collected during the window. */
  totalCollectedCents: integer("total_collected_cents").notNull(),
  capturedAt: integer("captured_at").notNull(),
});

export const insightsCache = sqliteTable(
  "insights_cache",
  {
    organizationId: integer("organization_id").notNull(),
    kind: text("kind").notNull(),
    payload: text("payload").notNull(),
    generatedAt: integer("generated_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.organizationId, t.kind] }),
  }),
);

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  amountCents: integer("amount_cents").notNull(),
  applicationFeeCents: integer("application_fee_cents"),
  refundedAmountCents: integer("refunded_amount_cents").notNull().default(0),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  qboPaymentId: text("qbo_payment_id"),
  receiptSentAt: integer("receipt_sent_at"),
  status: text("status").notNull(),
  paidAt: integer("paid_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const qboConnections = sqliteTable("qbo_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  realmId: text("realm_id").notNull().unique(),
  companyName: text("company_name"),
  accessTokenEnc: text("access_token_enc").notNull(),
  refreshTokenEnc: text("refresh_token_enc").notNull(),
  accessTokenExpiresAt: integer("access_token_expires_at").notNull(),
  refreshTokenExpiresAt: integer("refresh_token_expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const xeroConnections = sqliteTable("xero_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull().unique(),
  tenantId: text("tenant_id").notNull().unique(),
  tenantName: text("tenant_name"),
  accessTokenEnc: text("access_token_enc").notNull(),
  refreshTokenEnc: text("refresh_token_enc").notNull(),
  accessTokenExpiresAt: integer("access_token_expires_at").notNull(),
  refreshTokenExpiresAt: integer("refresh_token_expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const jobberConnections = sqliteTable("jobber_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull().unique(),
  accountId: text("account_id").notNull(),
  accountName: text("account_name"),
  accessTokenEnc: text("access_token_enc").notNull(),
  refreshTokenEnc: text("refresh_token_enc").notNull(),
  accessTokenExpiresAt: integer("access_token_expires_at").notNull(),
  refreshTokenExpiresAt: integer("refresh_token_expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const housecallProConnections = sqliteTable("housecallpro_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull().unique(),
  accountId: text("account_id"),
  accountName: text("account_name"),
  accessTokenEnc: text("access_token_enc").notNull(),
  refreshTokenEnc: text("refresh_token_enc"),
  accessTokenExpiresAt: integer("access_token_expires_at").notNull(),
  refreshTokenExpiresAt: integer("refresh_token_expires_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const serviceTitanConnections = sqliteTable("servicetitan_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull().unique(),
  tenantId: text("tenant_id").notNull(),
  tenantName: text("tenant_name"),
  accessTokenEnc: text("access_token_enc").notNull(),
  refreshTokenEnc: text("refresh_token_enc"),
  accessTokenExpiresAt: integer("access_token_expires_at").notNull(),
  refreshTokenExpiresAt: integer("refresh_token_expires_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const fieldPulseConnections = sqliteTable("fieldpulse_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull().unique(),
  accountName: text("account_name"),
  apiKeyEnc: text("api_key_enc").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const workizConnections = sqliteTable("workiz_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull().unique(),
  accountName: text("account_name"),
  apiTokenEnc: text("api_token_enc").notNull(),
  apiSecretEnc: text("api_secret_enc"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const qboDashboardCache = sqliteTable("qbo_dashboard_cache", {
  organizationId: integer("organization_id").primaryKey(),
  payload: text("payload").notNull(),
  refreshedAt: integer("refreshed_at").notNull(),
});

export const partners = sqliteTable("partners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  companyName: text("company_name"),
  referralCode: text("referral_code").notNull().unique(),
  commissionPercentBps: integer("commission_percent_bps").notNull().default(2000),
  payoutEmail: text("payout_email"),
  stripeAccountId: text("stripe_account_id"),
  status: text("status").notNull().default("active"),
  welcomeEmailSentAt: integer("welcome_email_sent_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const partnerReferrals = sqliteTable("partner_referrals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  partnerId: integer("partner_id").notNull(),
  organizationId: integer("organization_id").notNull().unique(),
  attributedAt: integer("attributed_at").notNull(),
  firstPaidAt: integer("first_paid_at"),
  churnedAt: integer("churned_at"),
  createdAt: integer("created_at").notNull(),
});

export const partnerCommissions = sqliteTable("partner_commissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  partnerId: integer("partner_id").notNull(),
  organizationId: integer("organization_id").notNull(),
  periodStart: integer("period_start").notNull(),
  periodEnd: integer("period_end").notNull(),
  basisCents: integer("basis_cents").notNull(),
  commissionCents: integer("commission_cents").notNull(),
  source: text("source").notNull(),
  status: text("status").notNull().default("pending"),
  paidAt: integer("paid_at"),
  payoutReference: text("payout_reference"),
  stripeTransferId: text("stripe_transfer_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const a2pRegistrations = sqliteTable("a2p_registrations", {
  organizationId: integer("organization_id").primaryKey(),
  brandId: text("brand_id"),
  campaignId: text("campaign_id"),
  brandStatus: text("brand_status").notNull().default("not_started"),
  campaignStatus: text("campaign_status").notNull().default("not_started"),
  legalBusinessName: text("legal_business_name"),
  businessEin: text("business_ein"),
  submittedAt: integer("submitted_at"),
  approvedAt: integer("approved_at"),
  updatedAt: integer("updated_at").notNull(),
});

export const orgReferrals = sqliteTable("org_referrals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  referrerOrgId: integer("referrer_org_id").notNull(),
  refereeOrgId: integer("referee_org_id").notNull().unique(),
  creditStatus: text("credit_status").notNull().default("pending"),
  creditedAt: integer("credited_at"),
  createdAt: integer("created_at").notNull(),
});

export const paymentPlans = sqliteTable("payment_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name"),
  totalCents: integer("total_cents").notNull(),
  installmentCount: integer("installment_count").notNull(),
  frequencyDays: integer("frequency_days").notNull(),
  status: text("status").notNull().default("active"),
  note: text("note"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const paymentPlanInstallments = sqliteTable("payment_plan_installments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id").notNull(),
  sequence: integer("sequence").notNull(),
  dueDate: text("due_date").notNull(),
  amountCents: integer("amount_cents").notNull(),
  payLinkToken: text("pay_link_token"),
  status: text("status").notNull().default("pending"),
  paidAt: integer("paid_at"),
  createdAt: integer("created_at").notNull(),
});

export type OrganizationRow = typeof organizations.$inferSelect;
export type OrganizationInviteRow = typeof organizationInvites.$inferSelect;
export type SmsConversationRow = typeof smsConversations.$inferSelect;
export type SmsMessageRow = typeof smsMessages.$inferSelect;
export type RateLimitEventRow = typeof rateLimitEvents.$inferSelect;
export type InboxReadRow = typeof inboxReads.$inferSelect;
export type WebhookEventRow = typeof webhookEvents.$inferSelect;
export type AuditEventRow = typeof auditEvents.$inferSelect;
export type CustomerSessionRow = typeof customerSessions.$inferSelect;
export type CustomerMagicLinkRow = typeof customerMagicLinks.$inferSelect;
export type SmsOptOutRow = typeof smsOptOuts.$inferSelect;
export type UserRole = "owner" | "manager" | "technician";
export type UserRow = typeof users.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type MagicLinkRow = typeof magicLinks.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type StripeConnectAccountRow = typeof stripeConnectAccounts.$inferSelect;
export type PayLinkRow = typeof payLinks.$inferSelect;
export type ReminderSendRow = typeof reminderSends.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;
export type QboConnectionRow = typeof qboConnections.$inferSelect;
export type XeroConnectionRow = typeof xeroConnections.$inferSelect;
export type JobberConnectionRow = typeof jobberConnections.$inferSelect;
export type HousecallProConnectionRow =
  typeof housecallProConnections.$inferSelect;
export type ServiceTitanConnectionRow =
  typeof serviceTitanConnections.$inferSelect;
export type FieldPulseConnectionRow =
  typeof fieldPulseConnections.$inferSelect;
export type WorkizConnectionRow = typeof workizConnections.$inferSelect;
export type QboDashboardCacheRow = typeof qboDashboardCache.$inferSelect;
export type PartnerRow = typeof partners.$inferSelect;
export type PartnerReferralRow = typeof partnerReferrals.$inferSelect;
export type PartnerCommissionRow = typeof partnerCommissions.$inferSelect;
export type A2pRegistrationRow = typeof a2pRegistrations.$inferSelect;
export type OrgReferralRow = typeof orgReferrals.$inferSelect;
export type PaymentPlanRow = typeof paymentPlans.$inferSelect;
export type PaymentPlanInstallmentRow = typeof paymentPlanInstallments.$inferSelect;
