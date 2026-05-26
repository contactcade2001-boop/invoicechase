import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  Check,
  CreditCard,
  FileSpreadsheet,
  Gauge,
  Mail,
  MessageSquare,
  Palette,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#reputation", label: "Reputation" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const features = [
  {
    icon: Sparkles,
    title: "AI replies in your voice (powered by Claude)",
    body: "Customers text back. Claude — Anthropic's flagship AI — answers using your business name, your payment terms, and the customer's exact balance and days late. Personalized, polite, on-brand. The moment you reply manually, autopilot pauses so you don't tag-team.",
  },
  {
    icon: Gauge,
    title: "Reputation score for every customer",
    body: "A 300–850 score (like a credit score) computed from each customer's payment history — how often they pay on time, how late they typically run, how big their unpaid balance is. Spot the riskiest customers in seconds. Score is only visible to you.",
  },
  {
    icon: Building2,
    title: "Live QuickBooks Online sync",
    body: "OAuth in 60 seconds. We read customers, invoices, and payments — and write payments and refund receipts back to QuickBooks. No CSV uploads, no daily exports, no double entry.",
  },
  {
    icon: MessageSquare,
    title: "One-click + bulk SMS reminders",
    body: "Text any customer a personalized reminder with a payment link. Or hit the big red button and text every overdue customer at once. STOP / HELP / START handled automatically per CTIA rules.",
  },
  {
    icon: Mail,
    title: "Email reminders with your branding",
    body: "Same one-click + bulk experience for email — your logo, your accent color, your tone. Pairs with SMS to maximize the chance someone actually reads it.",
  },
  {
    icon: CreditCard,
    title: "One-click Stripe payment links",
    body: "Every reminder includes a Stripe Checkout URL. Customers tap once, pay, and the payment posts back to QuickBooks automatically. Apple Pay, Google Pay, ACH, cards — Stripe handles all of it.",
  },
  {
    icon: CalendarClock,
    title: "Payment plans",
    body: "Split a balance into 2–24 installments with auto-generated pay links and reminder texts before each due date. Recover money that would otherwise become bad debt.",
  },
  {
    icon: TrendingUp,
    title: "Deposit collection",
    body: "When a low-reputation customer gets a new invoice, we auto-text them for a deposit before the work starts. Your highest-risk receivables collect themselves.",
  },
  {
    icon: Users,
    title: "Branded customer portal",
    body: "Each customer gets a self-serve portal at /p/your-business — outstanding balance, payment history, pay-now button — with your logo and color. They feel served, not chased.",
  },
  {
    icon: FileSpreadsheet,
    title: "AR aging + reconciliation exports",
    body: "Built-in CSV exports of your aging buckets (Current / 1–30 / 31–60 / 61–90 / 90+) and monthly reconciliation report. Hand them to your bookkeeper; they'll thank you.",
  },
  {
    icon: Palette,
    title: "Custom branding",
    body: "Upload your logo, pick an accent color, claim a portal slug. Receipts, customer portal, and invoice reminders all carry your brand — not ours.",
  },
  {
    icon: Zap,
    title: "Multi-seat with role-based access",
    body: "Bring your office team and your field techs onto one account. Owner sees everything, manager runs collections, technician gets a fast-pay-only mobile screen.",
  },
];

const reputationTiers = [
  {
    range: "800–850",
    label: "Excellent",
    color: "bg-emerald-500",
    desc: "Pays consistently on or before due date.",
  },
  {
    range: "740–799",
    label: "Strong",
    color: "bg-lime-500",
    desc: "Reliable, occasionally a few days late.",
  },
  {
    range: "670–739",
    label: "Good",
    color: "bg-amber-500",
    desc: "Average. Pays but sometimes needs a nudge.",
  },
  {
    range: "580–669",
    label: "Fair",
    color: "bg-orange-500",
    desc: "Recurring late payer. Worth requiring deposits.",
  },
  {
    range: "300–579",
    label: "Poor",
    color: "bg-red-500",
    desc: "High risk. Demand deposits or stop service.",
  },
];

const pricingFeatures = [
  "Live QuickBooks Online sync",
  "AI autopilot — replies in your voice, powered by Claude",
  "Customer reputation scoring (300–850)",
  "One-click + bulk SMS reminders",
  "One-click + bulk email reminders",
  "Stripe payment links + auto-posting to QuickBooks",
  "Branded customer payment portal",
  "Payment plans + scheduled reminders",
  "Auto-deposit collection for low-rep customers",
  "AR aging + monthly reconciliation CSV exports",
  "Multi-seat: owner / manager / technician roles",
  "Cancel anytime",
];

const faq = [
  {
    q: "How does the AI personalization work?",
    a: "Claude (Anthropic's AI) gets your business name, your SMS template style, the customer's name + balance + days late, and the conversation history — then replies in your voice. If it's unsure, the thread lands in your inbox and autopilot pauses.",
  },
  {
    q: "What's the reputation score?",
    a: "A 300–850 score per customer (like a credit score) based on their payment history. Tells you who to chase first and who to require deposits from. Private to you — customers never see it.",
  },
  {
    q: "How much faster will I get paid?",
    a: "Most SMBs see DSO drop 15–30 days within the first month — the combo of AI replies, one-click pay links, and bulk reminders compresses your collections timeline.",
  },
  {
    q: "What accounting software do you support?",
    a: "QuickBooks Online, Xero, and Jobber. One connection per business; switching is one click in Settings.",
  },
  {
    q: "How long does setup take?",
    a: "About 60 seconds. Connect your accounting with one OAuth click and the dashboard fills with your data immediately.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Disconnect with one click; cancel the subscription from /billing. No contracts, no penalties.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
          <div className="flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hidden text-slate-600 hover:text-slate-900 md:inline"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
            <Sparkles className="h-3 w-3" aria-hidden /> AI-powered AR for QuickBooks SMBs
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Stop chasing invoices.
            <br />
            <span className="text-emerald-700">Let AI get you paid.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-slate-600">
            Connect QuickBooks. We text and email your overdue customers, then{" "}
            <strong>Claude AI handles their replies in your voice</strong> —
            &ldquo;when can you pay?&rdquo;, &ldquo;can I split it?&rdquo;,
            &ldquo;send it to my new email&rdquo; — so you don&apos;t have to.
            You sleep; the money still comes in.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Get Started
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            $49/month + 1.9% per collected payment. No setup fee. Connect in 60 seconds.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-700">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-slate-700">
              Privacy Policy
            </Link>
            . We only text customers you already have a business relationship
            with. Recipients can reply STOP at any time.
          </p>
        </section>

        <section
          id="how-it-works"
          className="border-y border-slate-200 bg-slate-50 py-20"
        >
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Cashflow on autopilot
            </p>
            <h2 className="mt-3 text-center text-3xl font-bold tracking-tight">
              Set it up once. Watch the deposits land.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              The average SMB carries{" "}
              <strong>$30k–$300k of unpaid invoices</strong> at any time.
              Invoice Chase compresses that timeline so the cash you&apos;re
              owed actually shows up in your bank account.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  1
                </span>
                <h3 className="mt-4 text-lg font-semibold">Connect QuickBooks</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  60-second OAuth click. Customers, invoices, and payments
                  appear on your dashboard immediately. No CSVs, no
                  reconciliation, no daily babysitting.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  2
                </span>
                <h3 className="mt-4 text-lg font-semibold">
                  Hit the big red button
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  One click texts every overdue customer a personalized
                  reminder + a Stripe pay link. They tap, pay, and the payment
                  posts back to QuickBooks automatically.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  3
                </span>
                <h3 className="mt-4 text-lg font-semibold">
                  Let Claude handle the rest
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Customers reply at 11pm with questions, payment-plan
                  requests, complaints. Our AI answers — in your voice, with
                  the customer&apos;s exact balance and history — while you
                  sleep. You only get pinged when it&apos;s actually time to
                  step in.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Everything in the box
            </p>
            <h2 className="mt-3 text-center text-3xl font-bold tracking-tight">
              Twelve features. One subscription.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Nothing here is an add-on, an extra seat fee, or a higher tier.
              You get all of it for $49/month.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                >
                  <f.icon className="h-5 w-5 text-emerald-600" aria-hidden />
                  <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="reputation"
          className="border-y border-slate-200 bg-slate-50 py-20"
        >
          <div className="mx-auto max-w-3xl px-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
              <Gauge className="h-3 w-3" aria-hidden /> Reputation scoring
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Know who&apos;s going to pay you. Before they don&apos;t.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Every customer in your QuickBooks gets a 300–850 reputation
              score — exactly like a personal credit score, but private to
              you. We compute it from their payment history: how often they
              pay on time, how many days they typically run late, how often
              they&apos;ve gone 60+ days overdue, and how big their open
              balance is right now.
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 text-left">Score</th>
                    <th className="px-5 py-3 text-left">Tier</th>
                    <th className="px-5 py-3 text-left">What it means</th>
                  </tr>
                </thead>
                <tbody>
                  {reputationTiers.map((t) => (
                    <tr
                      key={t.range}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-5 py-4 font-mono text-sm text-slate-900">
                        {t.range}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`h-2 w-8 rounded-full ${t.color}`}
                            aria-hidden
                          />
                          <span className="text-sm font-semibold">
                            {t.label}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{t.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-10 text-xl font-semibold">
              Why this changes your cashflow
            </h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <strong>Bulk-text the riskiest customers first.</strong> The
                  dashboard sorts overdue customers by score so your time goes
                  to the accounts most likely to slip into bad debt.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <strong>
                    Auto-collect deposits from low-reputation customers.
                  </strong>{" "}
                  When a Poor- or Fair-rated customer gets a new invoice, we
                  text them a deposit link automatically — before you do the
                  work. No more bait-and-switch.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <strong>Make data-driven payment terms.</strong> Stop
                  extending Net-30 to people who&apos;ve always taken Net-90.
                  The score tells you who deserves what.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              The cashflow math
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              What does $49/month actually return?
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <Banknote
                  className="mx-auto h-6 w-6 text-emerald-600"
                  aria-hidden
                />
                <p className="mt-3 text-3xl font-bold tabular-nums">15–30</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">days</p>
                <p className="mt-2 text-xs text-slate-500">
                  Typical DSO drop within the first month
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <Zap className="mx-auto h-6 w-6 text-emerald-600" aria-hidden />
                <p className="mt-3 text-3xl font-bold tabular-nums">30s</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  to text everyone
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Bulk-text every overdue customer in one click
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <Sparkles
                  className="mx-auto h-6 w-6 text-emerald-600"
                  aria-hidden
                />
                <p className="mt-3 text-3xl font-bold tabular-nums">24/7</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  AI on-call
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Customer replies handled at 2am, in your voice
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="border-t border-slate-200 bg-slate-50 py-20"
        >
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Simple pricing
            </h2>
            <p className="mt-3 text-center text-slate-600">
              One plan. Everything included. Cancel anytime.
            </p>
            <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight">$49</span>
                <span className="text-lg text-slate-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Plus 1.9% on each payment we collect for you.
              </p>
              <ul className="mt-6 space-y-2.5">
                {pricingFeatures.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Get Started
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section id="faq" className="py-20">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Questions?
            </h2>
            <dl className="mt-10 space-y-6">
              {faq.map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl bg-white p-5 ring-1 ring-slate-200"
                >
                  <dt className="font-semibold text-slate-900">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-6 text-slate-600">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-slate-900 py-16 text-white">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Stop chasing. Start collecting.
            </h2>
            <p className="mt-3 text-slate-300">
              Connect QuickBooks in 60 seconds and let AI handle the
              follow-up. Sleep through the 11pm reply storm.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
            >
              Get Started
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row">
          <span className="font-semibold text-slate-700">Invoice Chase</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/help" className="hover:text-slate-700">
              Help
            </Link>
            <Link href="/changelog" className="hover:text-slate-700">
              Changelog
            </Link>
            <Link href="/privacy" className="hover:text-slate-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-700">
              Terms
            </Link>
            <Link href="/partners" className="hover:text-slate-700">
              Partner program
            </Link>
            <Link
              href="/integrations/quickbooks"
              className="hover:text-slate-700"
            >
              QuickBooks app
            </Link>
            <span>&copy; {new Date().getFullYear()} Invoice Chase</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
