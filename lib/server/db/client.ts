import "server-only";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DB_PATH = process.env.DB_PATH ?? "./data/app.db";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_user_id INTEGER NOT NULL,
  autopilot_enabled INTEGER NOT NULL DEFAULT 0,
  deposit_enabled INTEGER NOT NULL DEFAULT 0,
  deposit_percent_bps INTEGER NOT NULL DEFAULT 5000,
  deposit_threshold_score INTEGER NOT NULL DEFAULT 580,
  custom_receipts_enabled INTEGER NOT NULL DEFAULT 0,
  qbo_deposit_to_account_id TEXT,
  qbo_refund_account_id TEXT,
  qbo_refund_item_id TEXT,
  portal_slug TEXT UNIQUE,
  portal_accent_color TEXT,
  digest_phone TEXT,
  twilio_phone_number TEXT,
  last_digest_at INTEGER,
  last_deposit_poll_at INTEGER,
  last_invoice_cdc_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS organizations_twilio_phone ON organizations(twilio_phone_number);
CREATE UNIQUE INDEX IF NOT EXISTS organizations_portal_slug ON organizations(portal_slug) WHERE portal_slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS sms_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  customer_id TEXT,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  autopilot_paused INTEGER NOT NULL DEFAULT 0,
  last_message_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sms_conversations_org_phone ON sms_conversations(organization_id, customer_phone);

CREATE TABLE IF NOT EXISTS sms_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  direction TEXT NOT NULL,
  body TEXT NOT NULL,
  twilio_sid TEXT,
  autopilot INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sms_messages_conv ON sms_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket TEXT NOT NULL,
  hit_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limit_events_bucket_hit ON rate_limit_events(bucket, hit_at);

CREATE TABLE IF NOT EXISTS inbox_reads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  conversation_id INTEGER NOT NULL,
  last_read_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS inbox_reads_user_conv ON inbox_reads(user_id, conversation_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  user_id INTEGER,
  actor_email TEXT,
  kind TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_events_org_created ON audit_events(organization_id, created_at);

CREATE TABLE IF NOT EXISTS customer_sessions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS customer_sessions_email ON customer_sessions(email);

CREATE TABLE IF NOT EXISTS customer_magic_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  phone TEXT NOT NULL,
  reason TEXT,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS sms_opt_outs_org_phone ON sms_opt_outs(organization_id, phone);

CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  organization_id INTEGER,
  event_id TEXT,
  type TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  payload_digest TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS webhook_events_source_created ON webhook_events(source, created_at);
CREATE INDEX IF NOT EXISTS webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS webhook_events_org_created ON webhook_events(organization_id, created_at);

CREATE TABLE IF NOT EXISTS organization_invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS organization_invites_org_id ON organization_invites(organization_id);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  email_verified_at INTEGER,
  sms_template TEXT,
  owner_phone TEXT,
  organization_id INTEGER,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS magic_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL UNIQUE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  charges_enabled INTEGER NOT NULL DEFAULT 0,
  payouts_enabled INTEGER NOT NULL DEFAULT 0,
  details_submitted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pay_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  organization_id INTEGER NOT NULL,
  customer_id TEXT NOT NULL,
  amount_cents_override INTEGER,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS pay_links_org_customer ON pay_links(organization_id, customer_id);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  amount_cents INTEGER NOT NULL,
  application_fee_cents INTEGER,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  qbo_payment_id TEXT,
  refunded_amount_cents INTEGER NOT NULL DEFAULT 0,
  receipt_sent_at INTEGER,
  status TEXT NOT NULL,
  paid_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS payments_org_id ON payments(organization_id);

CREATE TABLE IF NOT EXISTS qbo_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL DEFAULT 0,
  realm_id TEXT NOT NULL UNIQUE,
  company_name TEXT,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT NOT NULL,
  access_token_expires_at INTEGER NOT NULL,
  refresh_token_expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS qbo_connections_org_id ON qbo_connections(organization_id);

CREATE TABLE IF NOT EXISTS qbo_dashboard_cache (
  organization_id INTEGER PRIMARY KEY,
  payload TEXT NOT NULL,
  refreshed_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT,
  company_name TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  commission_percent_bps INTEGER NOT NULL DEFAULT 2000,
  payout_email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  welcome_email_sent_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS partners_referral_code ON partners(referral_code);

CREATE TABLE IF NOT EXISTS partner_referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL UNIQUE,
  attributed_at INTEGER NOT NULL,
  first_paid_at INTEGER,
  churned_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS partner_referrals_partner_id ON partner_referrals(partner_id);

CREATE TABLE IF NOT EXISTS partner_commissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  basis_cents INTEGER NOT NULL,
  commission_cents INTEGER NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at INTEGER,
  payout_reference TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS partner_commissions_partner_period
  ON partner_commissions(partner_id, period_start);
CREATE UNIQUE INDEX IF NOT EXISTS partner_commissions_unique_period
  ON partner_commissions(partner_id, organization_id, period_start, source);
`;

function hasColumn(
  sqlite: Database.Database,
  table: string,
  column: string,
): boolean {
  const cols = sqlite
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;
  return cols.some((c) => c.name === column);
}

function tableHasRows(sqlite: Database.Database, table: string): boolean {
  try {
    const row = sqlite
      .prepare(`SELECT 1 FROM ${table} LIMIT 1`)
      .get() as unknown;
    return !!row;
  } catch {
    return false;
  }
}

function ensureLegacyMigrations(sqlite: Database.Database) {
  // payments: qbo_payment_id (already shipped — keep idempotent)
  if (
    hasColumn(sqlite, "payments", "id") &&
    !hasColumn(sqlite, "payments", "qbo_payment_id")
  ) {
    sqlite.exec("ALTER TABLE payments ADD COLUMN qbo_payment_id TEXT");
  }
  if (
    hasColumn(sqlite, "payments", "id") &&
    !hasColumn(sqlite, "payments", "refunded_amount_cents")
  ) {
    sqlite.exec(
      "ALTER TABLE payments ADD COLUMN refunded_amount_cents INTEGER NOT NULL DEFAULT 0",
    );
  }
  if (
    hasColumn(sqlite, "webhook_events", "id") &&
    !hasColumn(sqlite, "webhook_events", "organization_id")
  ) {
    sqlite.exec(
      "ALTER TABLE webhook_events ADD COLUMN organization_id INTEGER",
    );
  }
  // users: sms_template (already shipped)
  if (
    hasColumn(sqlite, "users", "id") &&
    !hasColumn(sqlite, "users", "sms_template")
  ) {
    sqlite.exec("ALTER TABLE users ADD COLUMN sms_template TEXT");
  }

  // === Multi-seat migration: org-scoping ============================
  // Add new columns; existing dev rows get backfilled to organization_id=1.
  if (!hasColumn(sqlite, "users", "owner_phone")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN owner_phone TEXT");
  }
  if (!hasColumn(sqlite, "users", "organization_id")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN organization_id INTEGER");
  }
  if (!hasColumn(sqlite, "users", "role")) {
    sqlite.exec(
      "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'owner'",
    );
  }
  if (!hasColumn(sqlite, "qbo_connections", "organization_id")) {
    sqlite.exec(
      "ALTER TABLE qbo_connections ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 0",
    );
  }
  if (!hasColumn(sqlite, "subscriptions", "organization_id")) {
    sqlite.exec(
      "ALTER TABLE subscriptions ADD COLUMN organization_id INTEGER",
    );
  }
  if (!hasColumn(sqlite, "stripe_connect_accounts", "organization_id")) {
    sqlite.exec(
      "ALTER TABLE stripe_connect_accounts ADD COLUMN organization_id INTEGER",
    );
  }
  if (!hasColumn(sqlite, "pay_links", "organization_id")) {
    sqlite.exec(
      "ALTER TABLE pay_links ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 0",
    );
  }
  if (!hasColumn(sqlite, "pay_links", "amount_cents_override")) {
    sqlite.exec(
      "ALTER TABLE pay_links ADD COLUMN amount_cents_override INTEGER",
    );
  }
  if (!hasColumn(sqlite, "payments", "organization_id")) {
    sqlite.exec(
      "ALTER TABLE payments ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 0",
    );
  }

  // Org settings columns added by S1/S2/S3.
  for (const [col, def] of [
    ["autopilot_enabled", "INTEGER NOT NULL DEFAULT 0"],
    ["deposit_enabled", "INTEGER NOT NULL DEFAULT 0"],
    ["deposit_percent_bps", "INTEGER NOT NULL DEFAULT 5000"],
    ["deposit_threshold_score", "INTEGER NOT NULL DEFAULT 580"],
    ["custom_receipts_enabled", "INTEGER NOT NULL DEFAULT 0"],
    ["qbo_deposit_to_account_id", "TEXT"],
    ["qbo_refund_account_id", "TEXT"],
    ["qbo_refund_item_id", "TEXT"],
    ["portal_slug", "TEXT"],
    ["portal_accent_color", "TEXT"],
    ["digest_phone", "TEXT"],
    ["twilio_phone_number", "TEXT"],
    ["last_digest_at", "INTEGER"],
    ["last_deposit_poll_at", "INTEGER"],
    ["last_invoice_cdc_at", "INTEGER"],
  ]) {
    if (
      hasColumn(sqlite, "organizations", "id") &&
      !hasColumn(sqlite, "organizations", col)
    ) {
      sqlite.exec(`ALTER TABLE organizations ADD COLUMN ${col} ${def}`);
    }
  }
  for (const [col, def] of [
    ["customer_email", "TEXT"],
    ["receipt_sent_at", "INTEGER"],
  ]) {
    if (
      hasColumn(sqlite, "payments", "id") &&
      !hasColumn(sqlite, "payments", col)
    ) {
      sqlite.exec(`ALTER TABLE payments ADD COLUMN ${col} ${def}`);
    }
  }
  if (
    hasColumn(sqlite, "sms_conversations", "id") &&
    !hasColumn(sqlite, "sms_conversations", "autopilot_paused")
  ) {
    sqlite.exec(
      "ALTER TABLE sms_conversations ADD COLUMN autopilot_paused INTEGER NOT NULL DEFAULT 0",
    );
  }

  // Backfill: each pre-existing user without an organization gets a personal
  // org owned by themselves. Also backfill the resource tables to point at
  // that org based on their old user_id column (kept around for legacy data).
  const orphanUsers = sqlite
    .prepare(
      "SELECT id, email FROM users WHERE organization_id IS NULL",
    )
    .all() as Array<{ id: number; email: string }>;
  for (const u of orphanUsers) {
    const now = Date.now();
    const orgName = u.email.split("@")[0] || `Org ${u.id}`;
    const result = sqlite
      .prepare(
        "INSERT INTO organizations (name, owner_user_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
      )
      .run(orgName, u.id, now, now);
    const orgId = Number(result.lastInsertRowid);
    sqlite
      .prepare(
        "UPDATE users SET organization_id = ?, role = 'owner' WHERE id = ?",
      )
      .run(orgId, u.id);
    if (hasColumn(sqlite, "qbo_connections", "user_id")) {
      sqlite
        .prepare(
          "UPDATE qbo_connections SET organization_id = ? WHERE user_id = ? AND organization_id = 0",
        )
        .run(orgId, u.id);
    }
    if (hasColumn(sqlite, "subscriptions", "user_id")) {
      sqlite
        .prepare(
          "UPDATE subscriptions SET organization_id = ? WHERE user_id = ? AND organization_id IS NULL",
        )
        .run(orgId, u.id);
    }
    if (hasColumn(sqlite, "stripe_connect_accounts", "user_id")) {
      sqlite
        .prepare(
          "UPDATE stripe_connect_accounts SET organization_id = ? WHERE user_id = ? AND organization_id IS NULL",
        )
        .run(orgId, u.id);
    }
    if (hasColumn(sqlite, "pay_links", "user_id")) {
      sqlite
        .prepare(
          "UPDATE pay_links SET organization_id = ? WHERE user_id = ? AND organization_id = 0",
        )
        .run(orgId, u.id);
    }
    if (hasColumn(sqlite, "payments", "user_id")) {
      sqlite
        .prepare(
          "UPDATE payments SET organization_id = ? WHERE user_id = ? AND organization_id = 0",
        )
        .run(orgId, u.id);
    }
  }
  void tableHasRows; // reserved for future migration checks
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _sqlite: Database.Database | null = null;

export function getDb() {
  if (_db) return _db;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  _sqlite = new Database(DB_PATH);
  _sqlite.pragma("journal_mode = WAL");
  _sqlite.exec(SCHEMA_SQL);
  ensureLegacyMigrations(_sqlite);
  _db = drizzle(_sqlite, { schema });
  return _db;
}
