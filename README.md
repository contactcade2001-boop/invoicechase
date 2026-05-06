# Invoice Chase

One-page dashboard for QuickBooks-using SMBs: see who owes you and collect with one click.

## Quick start

```bash
npm install
cp .env.local.example .env.local
# fill in APP_ENCRYPTION_KEY, QBO_CLIENT_ID, QBO_CLIENT_SECRET (see below)
npm run dev
```

Open http://localhost:3000 (or whatever port the CLI prints).

## Connecting QuickBooks (sandbox)

1. Go to https://developer.intuit.com/ and sign in.
2. **Create an app** → choose the QuickBooks Online API. You'll get a sandbox client ID and client secret.
3. In your app's *Keys & OAuth* tab, add this redirect URI:
   `http://localhost:3030/api/qbo/callback`
   (match the port to whatever you run the dev server on; update `QBO_REDIRECT_URI` to match.)
4. Generate an encryption key for token storage:
   ```bash
   openssl rand -base64 32
   ```
   Paste the output into `APP_ENCRYPTION_KEY`.
5. Copy your sandbox client ID/secret into `QBO_CLIENT_ID` / `QBO_CLIENT_SECRET`.
6. Run `npm run dev`, click **Connect QuickBooks**, sign in to your sandbox company, and you should land back on the dashboard with real data.

### Without QuickBooks credentials

Set `USE_MOCK_DATA=1` in `.env.local` to render the dashboard with hard-coded sample data — useful for UI iteration without an Intuit account.

## What gets stored

- **`./data/app.db`** — SQLite, gitignored. Holds one row per connected QBO company with the access/refresh tokens **encrypted at rest** (AES-256-GCM, key from `APP_ENCRYPTION_KEY`).
- The schema is created on first DB access; no migration step needed.

## Routes

- `/` — public landing page (hero, how-it-works, pricing, FAQ)
- `/dashboard` — the app itself (renders `ConnectPrompt` if no QBO connection, otherwise the live dashboard)
- `/api/qbo/connect`, `/callback`, `/disconnect` — OAuth lifecycle

## Architecture (today)

```
app/
  page.tsx                           landing page (server)
  dashboard/page.tsx                 server component; routes to ConnectPrompt or Dashboard
  api/qbo/
    connect/route.ts                 → Intuit authorize URL, sets state cookie
    callback/route.ts                exchange code, store encrypted tokens
    disconnect/route.ts              revoke token, delete row
components/
  Dashboard.tsx                      client component; filter state + composition
  ConnectPrompt.tsx                  not-yet-connected card
  ConnectionStatus.tsx               "Connected to {Company} · Disconnect"
  DashboardHeader, FilterTabs, CustomerTable, CustomerRow, ReputationMeter, BulkTextButton
lib/
  types.ts, format.ts, mockData.ts
  server/
    env.ts                           lazy env reader
    crypto.ts                        AES-256-GCM token encryption
    db/                              SQLite + Drizzle (qbo_connections table)
    qbo/
      config.ts                      sandbox URLs, scopes
      oauth.ts                       exchangeCodeForTokens, refreshAccessToken, revokeToken
      client.ts                      authenticated query w/ auto-refresh
      sync.ts                        getDashboardData() → mock | not-connected | live data
```

## Reputation score (placeholder)

`lib/server/qbo/sync.ts:reputationFromOldestDaysLate` derives a score from the oldest open invoice age. The full version will use paid-invoice payment history; this is enough for a meaningful initial color/tier per customer.

## Out of scope

Stripe checkout, Twilio SMS, auth, multi-tenant billing — coming in later slices.
