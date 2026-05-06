# Invoice Chase

Multi-tenant SaaS for QuickBooks-using SMBs: see who owes you, collect with one click, let an AI handle the back-and-forth, and split your team into roles.

## Quick start

```bash
npm install
cp .env.local.example .env.local
# fill in APP_ENCRYPTION_KEY, QBO_*, STRIPE_*, TWILIO_*, ANTHROPIC_*, RESEND_*
npm run dev
```

Open http://localhost:3000.

The end-to-end funnel is:

```
/  →  /login  →  email magic link  →  /dashboard
                                        ↓ (no active subscription)
                                       /billing  →  Stripe Checkout  →  /dashboard
                                        ↓ (no QBO connection)
                                       Connect QuickBooks  →  Intuit  →  back with live data
                                        ↓ (no Stripe Connect)
                                       /billing → Connect Stripe → back

  Customer SMS reply  →  /api/sms/inbound  →  Claude reply (autopilot)  →  /inbox
  Cron 9am Mon (UTC)  →  /api/cron/weekly-digest  →  text owner
  Cron hourly         →  /api/cron/deposit-poller →  CDC for new invoices
```

## Setup

### 1. App encryption key

```bash
openssl rand -base64 32
```

Paste into `APP_ENCRYPTION_KEY`. Used to encrypt QBO refresh tokens at rest.

### 2. QuickBooks

1. Create an app at https://developer.intuit.com/ → QuickBooks Online API.
2. Add `${APP_BASE_URL}/api/qbo/callback` to redirect URIs.
3. Copy sandbox client ID/secret into `QBO_CLIENT_ID` / `QBO_CLIENT_SECRET`.
4. `QBO_ENVIRONMENT=sandbox` (default) hits `https://sandbox-quickbooks.api.intuit.com`. Set to `production` to use the live API. Pagination, CDC for newly-created invoices, and auto-refresh of access tokens are all wired up.

### 3. Stripe (test mode)

1. Get test keys from https://dashboard.stripe.com/test/apikeys → `STRIPE_SECRET_KEY`.
2. Create a recurring $49/month price in test mode → `STRIPE_PRICE_ID`.
3. Enable Stripe Connect at https://dashboard.stripe.com/test/connect/overview.
4. Stripe CLI for local webhook delivery:
   ```bash
   stripe listen \
     --forward-to localhost:3000/api/stripe/webhook \
     --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,account.updated,charge.refunded,charge.dispute.created
   ```
   Paste the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.

### 4. Twilio (SMS)

1. Buy/claim a Twilio number → `TWILIO_FROM_NUMBER` (E.164).
2. Account SID + Auth Token → `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`.
3. Set the number's "A message comes in" webhook to `${APP_BASE_URL}/api/sms/inbound` so customer replies route into the inbox + autopilot.
4. Each org can also claim their own Twilio number from `/settings`; outbound texts use the org's number when set, and inbound resolves by `To` phone.
5. `USE_MOCK_SMS=1` logs payloads to the server console instead of hitting Twilio.

### 5. Magic-link emails (Resend)

For production set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. In dev, leave both blank — the magic link prints to the server console as `[auth] Magic link for …`.

### 6. Autopilot (Anthropic)

Set `ANTHROPIC_API_KEY` so Claude can reply when an org enables autopilot in `/settings`. Without a key, autopilot stays off and inbound messages are recorded silently.

### 7. Cron secret

```bash
openssl rand -base64 32
```

Paste into `CRON_SECRET`. Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` to the two cron endpoints (defined in `vercel.json`):

- `/api/cron/weekly-digest` — Mondays 14:00 UTC
- `/api/cron/deposit-poller` — every hour

### Dev shortcuts

- `USE_MOCK_DATA=1` — render the dashboard with hard-coded sample customers instead of hitting QBO.
- `USE_MOCK_SMS=1` — log SMS payloads instead of sending.

## Routes

| Surface | Routes |
|---|---|
| Public | `/`, `/login`, `/pay/[token]` |
| App (auth + active sub) | `/dashboard`, `/dashboard/customer/[id]`, `/inbox`, `/inbox/[id]`, `/payments`, `/settings`, `/team`, `/billing`, `/fast-pay` |
| Owner-only | `/billing`, `/team`, `/api/qbo/*`, `/api/stripe/{checkout,portal,connect}` |
| API | `/api/auth/{request,verify,logout}`, `/api/qbo/{connect,callback,disconnect}`, `/api/stripe/{checkout,portal,connect,webhook}`, `/api/pay/[token]/checkout`, `/api/sms/inbound`, `/api/cron/{weekly-digest,deposit-poller}` |
| Server actions | `app/actions/{sms,pay,team,inbox,qbo,org}.ts` |

## Roles

Each user belongs to one organization with a role:

- **owner** — everything: billing, Stripe Connect onboarding, QBO connect, /team, /settings (autopilot toggle, deposit config, digest phone, per-org Twilio number).
- **manager** — `/dashboard`, `/inbox`, `/payments`, `/settings` (SMS template only). No billing, no team management.
- **technician** — only `/fast-pay`. Search a customer, send the Fast-Pay text, copy the payment link. No payments view, no inbox, no settings.

Owners invite teammates from `/team`; the invite email contains a one-time link that signs the new user in directly with the assigned role.

## Features at a glance

- **Dashboard** — total owed, DSO, filterable customer list, reputation score per customer (300-850 from paid history with open-only fallback), Pay Now / Text per row, big bulk-text button.
- **Customer drill-in** — every open invoice (number, dates, balance, days late) for a customer.
- **Payments history** — date / customer / amount / fee / net / status, with a "Retry sync to QuickBooks" button on rows that didn't post.
- **Inbox** — every SMS thread (autopilot or manual) with per-user unread state, page navigation, per-thread autopilot pause, and a manual reply field that auto-pauses autopilot for that thread.
- **Autopilot** — Claude Haiku 4.5 generates replies to inbound texts. System prompt forbids agreeing to discounts/extensions or fabricating facts. Per-org toggle in `/settings`, per-thread pause from the inbox.
- **Deposit automation** — hourly cron uses QBO's CDC endpoint to detect newly-created invoices and texts a deposit request to high-risk customers (configurable %, threshold).
- **Weekly digest** — Mondays at 14:00 UTC the owner gets a one-line AR summary text.
- **Stripe Connect** — owner onboards an Express account; customer payments flow through `transfer_data.destination` with a 1.9% application fee; full refunds void the corresponding QBO Payment automatically.
- **Onboarding** — new owners see a 3-step checklist on the dashboard until QBO + Stripe + (optional) team are set up.

## What gets stored

`./data/app.db` (SQLite, gitignored):

| Table | Holds |
|---|---|
| `organizations` | one row per org with autopilot/deposit/digest settings, optional `twilio_phone_number` |
| `users` | email, role, organization_id, sms_template, owner_phone |
| `organization_invites` | hashed one-time invite tokens, 7-day TTL |
| `sessions` | session cookie ↔ user, 30-day TTL |
| `magic_links` | hashed sign-in tokens, 15-min TTL |
| `inbox_reads` | per-user `last_read_at` per conversation (drives unread badges) |
| `sms_conversations` | one per (org, customer phone), with `autopilot_paused` flag |
| `sms_messages` | every inbound + outbound, marked `autopilot=1` when sent by Claude |
| `subscriptions` | one row per org with Stripe customer + sub IDs, status, period end |
| `stripe_connect_accounts` | one row per org with `stripe_account_id` (Express) + capability flags |
| `pay_links` | tokens for the public `/pay/[token]` page, with optional `amount_cents_override` for deposits |
| `payments` | every customer payment: amounts, fees, Stripe IDs, `qbo_payment_id` |
| `qbo_connections` | one per org; access + refresh tokens encrypted with AES-256-GCM |
| `webhook_events` | every Stripe + Twilio webhook (received / processed / ignored / errored) for debugging |
| `rate_limit_events` | sliding-window rate limiter (SMS / pay-link buckets) |

Schema is created (and idempotently migrated) on first DB access.

## Architecture

```
app/
  page.tsx                              landing
  login/page.tsx                        magic-link form
  dashboard/page.tsx                    + onboarding checklist
  dashboard/customer/[id]/page.tsx      drill-in
  fast-pay/page.tsx                     mobile-first technician flow
  inbox/page.tsx                        conversation list (paginated, unread)
  inbox/[id]/page.tsx                   thread view + manual reply
  payments/page.tsx                     history + retry sync
  settings/page.tsx                     SMS template + automation + Twilio number
  team/page.tsx                         invite/role management
  team/accept/page.tsx                  invite acceptance
  billing/page.tsx                      subscription + Connect onboarding
  pay/[token]/page.tsx                  public customer payment page
  api/
    auth/{request,verify,logout}/
    cron/{weekly-digest,deposit-poller}/
    pay/[token]/checkout/
    qbo/{connect,callback,disconnect}/
    sms/inbound/
    stripe/{checkout,portal,connect,webhook}/
  actions/                              server actions: sms, pay, team, inbox, qbo, org

components/
  Dashboard, ConnectPrompt, ConnectionStatus, OnboardingChecklist
  DashboardHeader, FilterTabs, CustomerTable, CustomerRow, CustomerDetail
  ReputationMeter, BulkTextButton, RetrySyncButton, Skeleton
  AppHeader, AutomationSettings, SmsTemplateEditor
  TeamManagement, TechFastPay
  InboxList, InboxThread

lib/
  types.ts, format.ts, mockData.ts, smsTemplate.ts, inboxFormat.ts
  server/
    env.ts                              lazy env reader
    crypto.ts                           AES-256-GCM token encryption
    rateLimit.ts                        DB-backed sliding-window limiter
    inboxBadge.ts                       unread count helper
    auth/                               tokens, session, magic-link, invites
    anthropic/                          autopilot reply generation
    cron/                               auth, digest, deposits
    db/                                 client, schema, users, sessions,
                                        organizations, subscriptions,
                                        connections, connect, payLinks,
                                        payments, sms, inboxReads,
                                        webhookEvents
    email/                              resend wrapper (console fallback)
    pay/                                pay-link helper
    qbo/                                config, oauth, client (paginate, cdc),
                                        sync, reputation, recordPayment,
                                        voidPayment
    sms/                                autopilot resolver
    stripe/                             client, checkout, connect, payCheckout,
                                        webhook (incl. refund → void)
    twilio/                             client, sendRawSms / sendInvoiceSms
                                        (per-org from-number), verify
```

## Reputation score

Per-customer 300–850 score (`lib/server/qbo/reputation.ts`):

- **With payment history** (≥ 2 paid invoices in the last 24 months): joins paid `Invoice` rows to their linked `Payment` rows; combines avg days-late, on-time rate, and tenure.
- **Without history**: coarse score from the oldest open-invoice age.
- Risk tier (`high` / `medium` / `low`) is derived from the score.

## SMS, Autopilot, and the Inbox

Each text — outbound or inbound — appends to a row in `sms_messages` linked to a `sms_conversations` row scoped by `(organization_id, customer_phone)`.

When a customer replies, `/api/sms/inbound`:

1. Verifies the X-Twilio-Signature (HMAC-SHA1) in production.
2. Resolves the org by the `To` number (per-org Twilio numbers) with a fallback to existing conversation history on the platform's shared number.
3. Records the inbound message.
4. If autopilot is on for the org **and** the thread isn't paused, builds a context (business + customer + amount + days late + active pay link + last 30 messages) and asks Claude Haiku 4.5 for a reply, then sends it via Twilio.
5. Logs every step in `webhook_events` for debugging.

Owners + managers see all of it in `/inbox`. Sending a manual reply auto-pauses autopilot for that thread.

## Payments (Stripe Connect)

Each merchant onboards a Stripe Express account via `/billing` → "Connect Stripe". When a customer hits `/pay/[token]`:

1. Token resolves to (organization_id, customer_id), with optional `amount_cents_override` for deposit requests.
2. We re-query QBO for the customer's current open balance.
3. If Connect charges are enabled, render a Pay button. Click → `/api/pay/[token]/checkout` creates a Stripe Checkout session in `payment` mode with `transfer_data.destination = merchant_account_id` and `application_fee_amount = floor(amount × 0.019)`.
4. On webhook `checkout.session.completed`:
   - We record the payment in the `payments` table.
   - Post a `Payment` to QuickBooks via `lib/server/qbo/recordPayment.ts`, allocating the amount across open invoices oldest-first (FIFO by `TxnDate`). Surplus stays as customer credit. The returned `qbo_payment_id` is stored for idempotency.
5. On webhook `charge.refunded` (full refund only): mark our row `'refunded'` and POST `?operation=void` to QBO with the Payment's `Id` + `SyncToken`. Partial refunds are left for manual reconciliation.

## Cron jobs

Both endpoints require `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron sets this automatically; for any other scheduler (GitHub Actions, cron-job.org), pass it manually.

- **`/api/cron/weekly-digest`** (Mondays 14:00 UTC) — for each org with `digest_phone` set, text a one-line AR summary.
- **`/api/cron/deposit-poller`** (hourly) — for each org with deposits enabled, call QBO's CDC endpoint for invoices changed since `last_deposit_poll_at`, filter to ones whose `MetaData.CreateTime` is within the window (skip updates), then text a deposit-amount Pay link to high-risk customers.

## Tests

```bash
npm run test
```

32 Vitest unit tests covering: format helpers, SMS template substitution, reputation scoring, rate limiter, application fee math, auth tokens, FIFO `buildLines`. The rate-limit test points `DB_PATH` at a tempdir so it doesn't touch the real DB.

## Out of scope

Programmatic Twilio number provisioning (orgs add their own number manually in the Twilio console), real email templates beyond magic links, password-based auth, ACH / international payments, partial-refund accounting, A2P 10DLC registration automation.
