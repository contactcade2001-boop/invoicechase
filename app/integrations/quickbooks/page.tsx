import {
  ArrowRight,
  Building2,
  Check,
  Lock,
  MessageSquare,
  RefreshCcw,
  Shield,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Invoice Chase for QuickBooks Online",
  description:
    "Get paid faster on QuickBooks. Connect in 60 seconds, see who owes you, and collect with one-click SMS + Stripe payment links.",
};

const featureBullets = [
  {
    icon: Building2,
    title: "Live customer + invoice sync",
    body: "Pulls customers, open invoices, and payments from your QuickBooks Online company. No CSV uploads or daily exports.",
  },
  {
    icon: MessageSquare,
    title: "One-click + bulk SMS reminders",
    body: "Text every overdue customer in one click — each gets a personalized link. Reply STOP to opt out (we honor it automatically).",
  },
  {
    icon: RefreshCcw,
    title: "Payments post back to QuickBooks",
    body: "When a customer pays through Invoice Chase, we record the payment against the invoice and reconcile refunds the same way.",
  },
  {
    icon: Shield,
    title: "Built for the security review",
    body: "QBO refresh tokens encrypted at rest with AES-256-GCM. HTTPS-only. Per-org scope. Disconnect with one click and we revoke the token.",
  },
];

const screenshots = [
  {
    title: "Dashboard",
    body: "Total owed, DSO, and every overdue customer sorted by risk.",
  },
  {
    title: "One-click reminders",
    body: "Text individual customers or bulk-text every overdue account.",
  },
  {
    title: "Customer reputation",
    body: "Each customer gets a payment-history score so you know who to trust.",
  },
  {
    title: "Customer portal",
    body: "Branded portal where your customers see their balance and pay.",
  },
];

const compliance = [
  "OAuth 2.0 with state cookie; refresh tokens encrypted at rest (AES-256-GCM, env-supplied key)",
  "Read scope: customers + invoices + payments. Write only when posting a payment / refund receipt back to QBO.",
  "TLS-only cookies; SameSite=Lax sessions; magic-link auth with per-email rate limiting.",
  "Customer SMS disclosures and CTIA-compliant STOP / HELP / START handling.",
  "Per-org logical isolation; cached dashboard data invalidated on disconnect.",
  "30-day webhook event retention and 90-day audit retention.",
];

const faq = [
  {
    q: "How do I install this from the QuickBooks App Store?",
    a: "Click Get App Now from the listing. You'll be redirected to Invoice Chase, sign in or create your account, and confirm the OAuth grant. Setup takes about a minute.",
  },
  {
    q: "What QuickBooks Online editions does this support?",
    a: "Any QuickBooks Online edition: Simple Start, Essentials, Plus, and Advanced. We use the standard QBO API.",
  },
  {
    q: "What does it cost?",
    a: "$49/month plus 1.9% on each successful payment collected through Invoice Chase. Standard Stripe processing fees apply on top.",
  },
  {
    q: "Can I disconnect at any time?",
    a: "Yes. Disconnect from /settings and we revoke our OAuth refresh token with Intuit and drop our cached copy of your data.",
  },
];

export default function MarketplaceListingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-900/70 text-stone-100">
      <header className="border-b border-stone-800 bg-stone-900/70">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="text-stone-400 hover:text-stone-100">
              Privacy
            </Link>
            <Link href="/terms" className="text-stone-400 hover:text-stone-100">
              Terms
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Get app
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="border-b border-stone-800 bg-gradient-to-b from-emerald-50/40 to-white">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 md:grid-cols-[2fr,3fr] md:py-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                QuickBooks App Store · Accounts Receivable / Collections
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Invoice Chase for QuickBooks Online
              </h1>
              <p className="mt-4 text-lg leading-7 text-stone-400">
                Stop chasing invoices. Connect QuickBooks in 60 seconds, see
                everyone who owes you, and collect with one-click SMS reminders
                and Stripe payment links.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Get app
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="#security"
                  className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-stone-300 ring-1 ring-inset ring-stone-700 hover:bg-stone-950"
                >
                  Security &amp; data
                </Link>
              </div>
              <p className="mt-4 text-xs text-stone-500">
                $49/month + 1.9% per collected payment. Cancel any time.
              </p>
            </div>
            <div className="rounded-2xl bg-stone-900/70 p-6 shadow-sm ring-1 ring-stone-800 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                What it does
              </p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {featureBullets.map((f) => (
                  <li key={f.title} className="flex gap-3">
                    <f.icon
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-semibold text-stone-100">
                        {f.title}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-stone-400">
                        {f.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-stone-800 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-bold tracking-tight">Screenshots</h2>
            <p className="mt-2 text-sm text-stone-400">
              Final screenshots will be uploaded with the App Store submission;
              the placeholders below describe each view.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {screenshots.map((s, i) => (
                <div
                  key={s.title}
                  className="overflow-hidden rounded-2xl bg-stone-900/70 ring-1 ring-stone-800"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 text-xs font-medium text-stone-500">
                    Screenshot {i + 1}
                  </div>
                  <div className="border-t border-stone-800 p-4">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="mt-1 text-xs leading-5 text-stone-400">
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="security"
          className="border-b border-stone-800 bg-stone-950 py-16"
        >
          <div className="mx-auto max-w-3xl px-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Lock className="h-4 w-4" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wide">
                Security &amp; data handling
              </p>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Built for Intuit&apos;s security review
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              Invoice Chase reads only what&apos;s needed to show you what
              you&apos;re owed and writes back only payments and refund
              receipts you&apos;ve initiated. Tokens are encrypted; you can
              disconnect at any time. Full details:
            </p>
            <ul className="mt-6 space-y-2.5">
              {compliance.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2 text-sm leading-6 text-stone-300"
                >
                  <Check
                    className="mt-1 h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-6 text-stone-400">
              See our{" "}
              <Link
                href="/privacy"
                className="font-semibold text-stone-100 underline-offset-2 hover:underline"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="font-semibold text-stone-100 underline-offset-2 hover:underline"
              >
                Terms of Service
              </Link>{" "}
              for the full disclosure.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-2xl font-bold tracking-tight">FAQ</h2>
            <dl className="mt-8 space-y-4">
              {faq.map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl bg-stone-900/70 p-5 ring-1 ring-stone-800"
                >
                  <dt className="font-semibold text-stone-100">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-6 text-stone-400">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-slate-900 py-14 text-white">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to get paid faster?
            </h2>
            <p className="mt-3 text-slate-300">
              Connect QuickBooks in 60 seconds.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-stone-900/70 px-5 py-3 text-sm font-semibold text-stone-100 shadow-sm transition hover:bg-slate-100"
            >
              Get app
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-800 bg-stone-900/70 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 text-sm text-stone-500">
          <span className="font-semibold text-stone-300">Invoice Chase</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-stone-300">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-stone-300">
              Terms
            </Link>
            <Link href="/partners" className="hover:text-stone-300">
              Partners
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
