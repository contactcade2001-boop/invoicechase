#!/usr/bin/env node
// Pre-flight check: verifies every env var the production app needs is set
// and not still pointing at sandbox / test endpoints. Exits 1 with a list
// of problems if anything is wrong, 0 with a green summary if everything
// passes.
//
// Usage (against your live secret store, e.g. on the deployed machine):
//   npm run launch-check
//
// Or locally with a real .env.production file:
//   node --env-file=.env.production scripts/check-launch-ready.mjs

const required = [
  "APP_BASE_URL",
  "APP_ENCRYPTION_KEY",
  "CRON_SECRET",
  "ADMIN_EMAILS",
  "DB_PATH",
  "QBO_ENVIRONMENT",
  "QBO_CLIENT_ID",
  "QBO_CLIENT_SECRET",
  "QBO_REDIRECT_URI",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_NUMBER",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "ANTHROPIC_API_KEY",
];

const recommended = ["SENTRY_DSN", "LITESTREAM_REPLICA_URL"];

const errors = [];
const warnings = [];
const info = [];

function err(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}
function note(msg) {
  info.push(msg);
}

// 1) Required env vars present + not placeholders.
for (const key of required) {
  const v = process.env[key];
  if (!v) {
    err(`${key} is not set`);
    continue;
  }
  if (v.includes("__REPLACE_ME__")) {
    err(`${key} still contains __REPLACE_ME__ placeholder`);
  }
}

// 2) Test/sandbox sniff tests.
if (process.env.NODE_ENV !== "production") {
  warn(`NODE_ENV=${process.env.NODE_ENV ?? "<unset>"} (expected "production")`);
}
if (process.env.QBO_ENVIRONMENT && process.env.QBO_ENVIRONMENT !== "production") {
  err(`QBO_ENVIRONMENT=${process.env.QBO_ENVIRONMENT} — flip to "production"`);
}
if (
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")
) {
  err("STRIPE_SECRET_KEY is a test-mode key (sk_test_*)");
}
if (
  process.env.STRIPE_PRICE_ID &&
  process.env.STRIPE_PRICE_ID.startsWith("price_")
) {
  // No way to tell test vs live by prefix alone — just note it.
  note("STRIPE_PRICE_ID set; verify it's a live-mode price in the Stripe dashboard");
}

// 3) Mock toggles must NOT be truthy.
const truthy = (v) => v != null && v !== "" && v !== "0" && v !== "false";
if (truthy(process.env.USE_MOCK_DATA)) {
  err("USE_MOCK_DATA is set — production must hit real QBO");
}
if (truthy(process.env.USE_MOCK_SMS)) {
  err("USE_MOCK_SMS is set — production must hit real Twilio");
}

// 4) Encryption key shape.
if (process.env.APP_ENCRYPTION_KEY) {
  try {
    const decoded = Buffer.from(process.env.APP_ENCRYPTION_KEY, "base64");
    if (decoded.length !== 32) {
      err(
        `APP_ENCRYPTION_KEY decodes to ${decoded.length} bytes (need exactly 32)`,
      );
    }
  } catch {
    err("APP_ENCRYPTION_KEY is not valid base64");
  }
}

// 5) URL shape.
if (process.env.APP_BASE_URL && !/^https:\/\//.test(process.env.APP_BASE_URL)) {
  err(`APP_BASE_URL=${process.env.APP_BASE_URL} (must be https://)`);
}
if (
  process.env.QBO_REDIRECT_URI &&
  !/^https:\/\//.test(process.env.QBO_REDIRECT_URI)
) {
  err(`QBO_REDIRECT_URI=${process.env.QBO_REDIRECT_URI} (must be https://)`);
}

// 6) Recommended.
for (const key of recommended) {
  if (!process.env[key]) {
    warn(`${key} not set (recommended for production)`);
  }
}

// 7) Resend "from" header sanity.
const from = process.env.RESEND_FROM_EMAIL ?? "";
if (from && !/[\w.-]+@[\w.-]+/.test(from)) {
  err(`RESEND_FROM_EMAIL=${from} — must be "Name <user@domain>" or a bare email`);
}

// 8) Twilio number shape.
const tw = process.env.TWILIO_FROM_NUMBER ?? "";
if (tw && !/^\+\d{6,15}$/.test(tw)) {
  err(`TWILIO_FROM_NUMBER=${tw} — must be E.164 (+15551234567)`);
}

const reset = "\x1b[0m";
const red = "\x1b[31m";
const yellow = "\x1b[33m";
const green = "\x1b[32m";
const cyan = "\x1b[36m";

if (errors.length > 0) {
  console.log(`${red}✘ Launch readiness: ${errors.length} blocker(s)${reset}`);
  for (const e of errors) console.log(`  ${red}-${reset} ${e}`);
} else {
  console.log(`${green}✔ Launch readiness: required vars OK${reset}`);
}

if (warnings.length > 0) {
  console.log(`${yellow}⚠ Warnings:${reset}`);
  for (const w of warnings) console.log(`  ${yellow}-${reset} ${w}`);
}

if (info.length > 0) {
  console.log(`${cyan}ℹ Notes:${reset}`);
  for (const i of info) console.log(`  ${cyan}-${reset} ${i}`);
}

process.exit(errors.length > 0 ? 1 : 0);
