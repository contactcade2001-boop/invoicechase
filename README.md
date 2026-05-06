# Invoice Chase

One-page dashboard for QuickBooks-using SMBs: see who owes you and collect with one click.

## Quick start

```bash
npm install
cp .env.local.example .env.local
# fill in APP_ENCRYPTION_KEY, QBO_*, STRIPE_* (see below)
npm run dev
```

Open http://localhost:3000.

The end-to-end funnel is:

```
/  →  /login  →  email magic link  →  /dashboard
                                        ↓ (no active subscription)
                                       /billing  →  Stripe Checkout  →  /dashboard
                                        ↓ (connected)
                                       Connect QuickBooks  →  Intuit  →  /dashboard with live data
```

## Setup

### 1. App encryption key

```bash
openssl rand -base64 32
```

Paste into `APP_ENCRYPTION_KEY`. Used to encrypt QBO tokens at rest.

### 2. QuickBooks (sandbox)

1. Create an app at https://developer.intuit.com/ → QuickBooks Online API.
2. Add `${APP_BASE_URL}/api/qbo/callback` to redirect URIs (match port to your dev server).
3. Copy sandbox client ID/secret into `QBO_CLIENT_ID` / `QBO_CLIENT_SECRET`.

### 3. Stripe (test mode)

1. Get test keys from https://dashboard.stripe.com/test/apikeys → `STRIPE_SECRET_KEY`.
2. Create a recurring $49/month price in test mode → copy the `price_…` ID into `STRIPE_PRICE_ID`.
3. For local webhooks, install the Stripe CLI and run:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the printed signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.

### 4. Magic-link emails

In dev, magic links are **logged to the server console** (look for `[auth] Magic link for …`). For production, swap the TODO in `lib/server/auth/magic-link.ts` for a real email provider (Resend, Postmark, SES).

### 5. Twilio (SMS)

1. Buy or claim a Twilio number from https://console.twilio.com → put it in `TWILIO_FROM_NUMBER` in E.164 format (e.g. `+14155551234`).
2. Copy your Account SID + Auth Token into `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`.
3. Or set `USE_MOCK_SMS=1` to log SMS payloads to the server console instead of hitting Twilio.

### `USE_MOCK_DATA=1`

Renders the dashboard with hard-coded sample data instead of hitting QBO. Useful for UI iteration without an Intuit account. Subscription gate still applies.

### `USE_MOCK_SMS=1`

Skips Twilio entirely; SMS messages are logged to the server console as `[sms:mock] to=… body=…`. Combine with `USE_MOCK_DATA=1` for a fully offline demo.

## Routes

- `/` — public landing page
- `/login` — magic-link sign-in / sign-up
- `/dashboard` — the app (auth + active subscription required; renders `ConnectPrompt` when no QBO connection)
- `/billing` — subscription management (auth required)
- `/api/auth/{request,verify,logout}` — magic-link lifecycle
- `/api/qbo/{connect,callback,disconnect}` — QuickBooks OAuth lifecycle
- `/api/stripe/{checkout,portal,webhook}` — Stripe billing lifecycle
- Server actions in `app/actions/sms.ts` — Twilio SMS for the Text and bulk-text buttons

## What gets stored

`./data/app.db` (SQLite, gitignored):

| Table | Holds |
|---|---|
| `users` | email + verified-at timestamp |
| `sessions` | session cookie ↔ user |
| `magic_links` | hashed one-time tokens, 15-min TTL |
| `subscriptions` | one row per user with `stripe_customer_id`, `stripe_subscription_id`, status, current period end |
| `qbo_connections` | one row per QBO company linked to a user; access/refresh tokens encrypted with AES-256-GCM |

Schema is created (and idempotently migrated) on first DB access.

## Architecture

```
app/
  page.tsx                           landing page
  login/page.tsx                     magic-link form
  dashboard/page.tsx                 auth + sub gate, live data
  billing/page.tsx                   Checkout / Portal entry
  api/
    auth/{request,verify,logout}/    magic-link routes
    qbo/{connect,callback,disconnect}/
    stripe/{checkout,portal,webhook}/
components/
  Dashboard, ConnectPrompt, ConnectionStatus,
  DashboardHeader, FilterTabs, CustomerTable, CustomerRow,
  ReputationMeter, BulkTextButton, AppHeader
lib/
  types.ts, format.ts, mockData.ts
  server/
    env.ts                           lazy env reader
    crypto.ts                        token encryption
    auth/                            tokens, session, magic-link
    db/                              client, schema, users, sessions,
                                     subscriptions, connections
    qbo/                             config, oauth, client, sync, reputation
    stripe/                          client, checkout (+portal), webhook
    twilio/                          client, sendInvoiceSms
```

## Reputation score

Per-customer 300–850 score (`lib/server/qbo/reputation.ts`):

- **With payment history** (≥ 2 paid invoices in the last 24 months): joins paid `Invoice` rows to their linked `Payment` rows; combines average days-late, on-time rate, and tenure.
- **Without payment history**: falls back to a coarse score from the oldest open invoice age.

Risk tier (`high` / `medium` / `low`) is derived from the score in `sync.ts`.

## SMS

The Text button and the bulk "Text ALL overdue" button call server actions in `app/actions/sms.ts`. Each message is `Pay $X now: ${APP_BASE_URL}/pay/{customerId}`. The `/pay/:customerId` route doesn't exist yet — it lands in the next slice (Stripe Checkout for the 1.9% success fee).

## Out of scope

Real email delivery, Stripe Connect for the 1.9% success fee + the `/pay/:customerId` route, full pagination of QBO queries, password-based auth.
