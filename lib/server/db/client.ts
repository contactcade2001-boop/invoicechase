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
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

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
  amount_cents INTEGER NOT NULL,
  application_fee_cents INTEGER,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  qbo_payment_id TEXT,
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
