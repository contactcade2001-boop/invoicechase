import "server-only";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

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
export type QboDashboardCacheRow = typeof qboDashboardCache.$inferSelect;
export type PartnerRow = typeof partners.$inferSelect;
export type PartnerReferralRow = typeof partnerReferrals.$inferSelect;
export type PartnerCommissionRow = typeof partnerCommissions.$inferSelect;
export type A2pRegistrationRow = typeof a2pRegistrations.$inferSelect;
export type OrgReferralRow = typeof orgReferrals.$inferSelect;
export type PaymentPlanRow = typeof paymentPlans.$inferSelect;
export type PaymentPlanInstallmentRow = typeof paymentPlanInstallments.$inferSelect;
