#!/usr/bin/env node
// Mints fresh production secrets. Print them; never write to disk.
//   APP_ENCRYPTION_KEY: 32 bytes, base64 (used by lib/server/crypto.ts).
//   CRON_SECRET: 32 bytes, base64url (Bearer token for /api/cron/*).
//
// Usage:
//   node scripts/generate-secrets.mjs
// or
//   npm run gen-secrets

import { randomBytes } from "node:crypto";

const appKey = randomBytes(32).toString("base64");
const cronSecret = randomBytes(32).toString("base64url");

const lines = [
  "# Fresh secrets — paste into your host's secret store.",
  "# DO NOT commit these to source control.",
  "",
  `APP_ENCRYPTION_KEY=${appKey}`,
  `CRON_SECRET=${cronSecret}`,
];

console.log(lines.join("\n"));
