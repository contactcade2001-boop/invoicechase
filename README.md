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
3. **Enable Stripe Connect** at https://dashboard.stripe.com/test/connect/overview (no extra env vars — the existing secret key is used to manage Connect accounts on behalf of your platform).
4. For local webhooks, install the Stripe CLI and run:
   ```bash
   stripe listen \
     --forward-to localhost:3000/api/stripe/webhook \
     --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,account.updated
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
- `/api/stripe/{checkout,portal,connect,webhook}` — Stripe subscription + Connect onboarding + webhook
- `/pay/[token]` — public payment page reached via SMS or Pay Now
- `/api/pay/[token]/checkout` — creates a one-time Stripe Checkout session for the customer
- Server actions in `app/actions/{sms,pay}.ts` — Twilio SMS, Pay Now URL generation

## What gets stored

`./data/app.db` (SQLite, gitignored):

| Table | Holds |
|---|---|
| `users` | email + verified-at timestamp |
| `sessions` | session cookie ↔ user |
| `magic_links` | hashed one-time tokens, 15-min TTL |
| `subscriptions` | one row per user with `stripe_customer_id`, `stripe_subscription_id`, status, current period end |
| `stripe_connect_accounts` | one row per user with `stripe_account_id` (Express) and the `charges_enabled` / `payouts_enabled` flags |
| `pay_links` | random tokens that map to (user_id, customer_id); 30-day TTL, used in SMS + Pay Now URLs |
| `payments` | record of every one-time customer payment (Stripe checkout session + payment intent IDs, amount, application fee) |
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
    qbo/                             config, oauth, client, sync, reputation, recordPayment
    stripe/                          client, checkout, connect, payCheckout, webhook
    twilio/                          client, sendInvoiceSms
    pay/                             pay-link helper
```

## Reputation score

Per-customer 300–850 score (`lib/server/qbo/reputation.ts`):

- **With payment history** (≥ 2 paid invoices in the last 24 months): joins paid `Invoice` rows to their linked `Payment` rows; combines average days-late, on-time rate, and tenure.
- **Without payment history**: falls back to a coarse score from the oldest open invoice age.

Risk tier (`high` / `medium` / `low`) is derived from the score in `sync.ts`.

## SMS

The Text button and the bulk "Text ALL overdue" button call server actions in `app/actions/sms.ts`. Each message is `Pay $X now: ${APP_BASE_URL}/pay/{token}` where `{token}` is a random pay-link key (`pay_links` table, 30-day TTL). Pay Now uses the same link generator and opens the public page in a new tab.

## Payments (Stripe Connect)

Each merchant onboards a Stripe Express account via `/billing` → "Connect Stripe". When a customer hits `/pay/[token]`:

1. Token is resolved to (user_id, customer_id, expires_at).
2. We re-query QBO for the customer's current open balance.
3. If charges are enabled, we render a Pay button.
4. On click, `/api/pay/[token]/checkout` creates a one-time Stripe Checkout session in `payment` mode with `transfer_data.destination` pointing at the merchant's Connect account and an `application_fee_amount` of 1.9% (190 bps via `applicationFeeCents` in `lib/server/stripe/connect.ts`).
5. On success, the webhook:
   - Records the payment in the `payments` table.
   - Posts a `Payment` to QuickBooks (`lib/server/qbo/recordPayment.ts`) that allocates the paid amount across the customer's open invoices oldest-first (FIFO by `TxnDate`). The returned QBO Payment ID is stored on the row to make the webhook idempotent — duplicate deliveries skip the QBO call.

## Out of scope

Real email delivery, full pagination of QBO queries, password-based auth.
