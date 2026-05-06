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
  digestPhone: text("digest_phone"),
  lastDigestAt: integer("last_digest_at"),
  lastDepositPollAt: integer("last_deposit_poll_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const smsConversations = sqliteTable("sms_conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id"),
  customerPhone: text("customer_phone").notNull(),
  customerName: text("customer_name"),
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
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name"),
  amountCents: integer("amount_cents").notNull(),
  applicationFeeCents: integer("application_fee_cents"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  qboPaymentId: text("qbo_payment_id"),
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

export type OrganizationRow = typeof organizations.$inferSelect;
export type OrganizationInviteRow = typeof organizationInvites.$inferSelect;
export type SmsConversationRow = typeof smsConversations.$inferSelect;
export type SmsMessageRow = typeof smsMessages.$inferSelect;
export type UserRole = "owner" | "manager" | "technician";
export type UserRow = typeof users.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type MagicLinkRow = typeof magicLinks.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type StripeConnectAccountRow = typeof stripeConnectAccounts.$inferSelect;
export type PayLinkRow = typeof payLinks.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;
export type QboConnectionRow = typeof qboConnections.$inferSelect;
