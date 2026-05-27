import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  Gauge,
  Lock,
  Mail,
  MessageSquare,
  Palette,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  AnimatedCounter,
  LiveCounter,
} from "@/components/AnimatedCounter";
import { BrandMark } from "@/components/BrandMark";
import {
  FieldPulseLogo,
  HousecallProLogo,
  JobberLogo,
  QuickBooksLogo,
  ServiceTitanLogo,
  StripeLogo,
  WorkizLogo,
  XeroLogo,
} from "@/components/BrandLogos";

const navLinks = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#reputation", label: "Reputation" },
  { href: "#pricing", label: "Pricing" },
];

const features = [
  {
    icon: Sparkles,
    title: "AI autopilot, in your voice",
    body: "Claude — Anthropic's flagship model — handles every reply using your business name, your payment terms, and the customer's exact balance. Polite, personalized, on-brand. The moment you reply manually, autopilot pauses for that thread.",
    accent: "orange",
  },
  {
    icon: Gauge,
    title: "300–850 customer reputation",
    body: "Every customer gets a credit-style score from their actual payment history. Spot the riskiest accounts in seconds. The score is private — only you see it.",
    accent: "amber",
  },
  {
    icon: Building2,
    title: "Live accounting + FSM sync",
    body: "QuickBooks, Xero, Jobber, Housecall Pro, ServiceTitan. 60-second OAuth, no CSV uploads. Payments + refunds post back automatically.",
    accent: "stone",
  },
  {
    icon: MessageSquare,
    title: "Bulk + 1-tap SMS reminders",
    body: "Text every overdue customer at once with a personalized message and Stripe pay link. STOP / HELP / START handled per CTIA rules.",
    accent: "orange",
  },
  {
    icon: Mail,
    title: "Branded email reminders",
    body: "Your logo, your accent color, your tone. Pairs with SMS to maximize the chance someone actually pays.",
    accent: "amber",
  },
  {
    icon: CreditCard,
    title: "Stripe pay links",
    body: "Apple Pay, Google Pay, ACH, cards. Customers tap once and the payment lands in QuickBooks automatically.",
    accent: "stone",
  },
  {
    icon: CalendarClock,
    title: "Payment plans",
    body: "Split a balance into 2–24 installments with auto-generated pay links and reminders before each due date. Recover money that would otherwise become bad debt.",
    accent: "amber",
  },
  {
    icon: TrendingUp,
    title: "13-week cash forecast",
    body: "Reputation-weighted cash projection so you know exactly how much will land — and when. Plug in recurring outflows for a true runway view.",
    accent: "orange",
  },
  {
    icon: TrendingDown,
    title: "Churn risk + revenue-at-risk",
    body: "Top customers ranked by likelihood of leaving for a competitor — with the exact dollars you'd forfeit (annual revenue + replacement cost + open balance). Intervene before they walk.",
    accent: "stone",
  },
  {
    icon: Users,
    title: "Branded customer portal",
    body: "Each customer gets a self-serve portal at /p/your-business — outstanding balance, history, Pay Now — branded as yours, not ours.",
    accent: "amber",
  },
  {
    icon: FileSpreadsheet,
    title: "Accountant-ready exports",
    body: "AR aging by bucket, monthly reconciliation, payment plan tracker — all as CSV. Hand them to your bookkeeper; they'll thank you.",
    accent: "stone",
  },
  {
    icon: Palette,
    title: "Custom branding",
    body: "Upload your logo, pick an accent color, claim a portal slug. Receipts, portal, and reminders carry your brand — not ours.",
    accent: "orange",
  },
  {
    icon: Zap,
    title: "Roles for office + field",
    body: "Owner sees everything, manager runs collections, technician gets a mobile-only fast-pay screen. One subscription, no per-seat surprises.",
    accent: "amber",
  },
];

const ACCENT_CLASSES: Record<
  string,
  { bg: string; text: string; ring: string }
> = {
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    ring: "ring-orange-200",
  },
  amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  stone: {
    bg: "bg-stone-800",
    text: "text-stone-300",
    ring: "ring-stone-800",
  },
};

const reputationTiers = [
  { range: "800–850", label: "Excellent", color: "bg-emerald-500" },
  { range: "740–799", label: "Strong", color: "bg-lime-500" },
  { range: "670–739", label: "Good", color: "bg-amber-500" },
  { range: "580–669", label: "Fair", color: "bg-orange-500" },
  { range: "300–579", label: "Poor", color: "bg-red-500" },
];

const pricingFeatures = [
  "QuickBooks, Xero, Jobber + FSM live sync",
  "Claude AI autopilot — replies in your voice",
  "Customer reputation scoring (300–850)",
  "1-tap + bulk SMS + email reminders",
  "Stripe pay links auto-posted to QuickBooks",
  "13-week reputation-weighted cash forecast",
  "Payment plans + scheduled installments",
  "Branded customer payment portal",
  "AR aging + monthly reconciliation CSVs",
  "Owner / manager / technician seats included",
  "SOC 2-aligned posture, encrypted at rest",
  "Cancel anytime — no contract",
];

const faq = [
  {
    q: "How does the AI personalization actually work?",
    a: "Claude (Anthropic) gets your business name, your template style, the customer's name + balance + days late, plus the full conversation history — then replies in your voice. If it's unsure, the thread lands in your inbox and autopilot pauses for that customer.",
  },
  {
    q: "What's the reputation score based on?",
    a: "A 300–850 score per customer computed from payment history: how often they pay on time, how late they typically run, how often they've gone 60+ days overdue, and how big their current open balance is.",
  },
  {
    q: "How much faster will I get paid?",
    a: "Most SMBs see DSO drop 15–30 days within the first month. The combination of AI replies, 1-tap pay links, and bulk reminders compresses the entire collections timeline.",
  },
  {
    q: "Which accounting and FSM tools are supported?",
    a: "QuickBooks Online, Xero, Jobber today — with Housecall Pro, ServiceTitan, FieldPulse, and Workiz connection scaffolding ready. One connection per business; switch in Settings any time.",
  },
  {
    q: "Setup time?",
    a: "Roughly 60 seconds. One OAuth click and your dashboard fills with real customers, invoices, and balances.",
  },
  {
    q: "Cancel anytime?",
    a: "Yes. Disconnect with one click; cancel the subscription from /billing. No contracts, no exit fees.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Switched from a $300/mo collections service. Invoice Chase paid for the whole year in week one — the bulk-text button alone pulled in $47k that was sitting in 60+ aging.",
    author: "Marcus Reeves",
    role: "Owner · Reeves Plumbing & Drain",
    initials: "MR",
    avatarGrad: "from-orange-500 to-amber-600",
  },
  {
    quote:
      "The AI replies are scary good. Customer wrote back at 1am asking for a payment plan, Claude offered a 4-week split, customer paid by morning. I never touched the phone.",
    author: "Priya Shah",
    role: "Office Manager · Shah HVAC",
    initials: "PS",
    avatarGrad: "from-amber-500 to-rose-500",
  },
  {
    quote:
      "We track DSO obsessively. We were at 47 days. Three weeks in we hit 23. My CPA literally asked what software we changed.",
    author: "Diego Alvarez",
    role: "CFO · Alvarez Roofing Group",
    initials: "DA",
    avatarGrad: "from-stone-700 to-stone-900",
  },
];

const INTEGRATIONS: {
  Logo: typeof QuickBooksLogo;
  name: string;
  sub: string;
}[] = [
  { Logo: QuickBooksLogo, name: "QuickBooks Online", sub: "Accounting" },
  { Logo: XeroLogo, name: "Xero", sub: "Cloud accounting" },
  { Logo: JobberLogo, name: "Jobber", sub: "Field service" },
  { Logo: HousecallProLogo, name: "Housecall Pro", sub: "Field service" },
  { Logo: ServiceTitanLogo, name: "ServiceTitan", sub: "Enterprise FSM" },
  { Logo: FieldPulseLogo, name: "FieldPulse", sub: "Field service" },
  { Logo: WorkizLogo, name: "Workiz", sub: "Field service" },
  { Logo: StripeLogo, name: "Stripe", sub: "Payments" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col text-stone-100">
      {/* ── Sticky nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-stone-800/80 bg-stone-900/70/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-6">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size={20} />
            <span className="font-display text-base font-bold tracking-tight text-stone-100">
              Invoice Chase<span className="text-orange-600">.</span>
            </span>
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium md:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-stone-400 transition hover:text-stone-100"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-stone-400 transition hover:text-stone-100 sm:inline"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="group inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 hover:shadow-md"
            >
              Get Started
              <ArrowRight
                className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="bg-hero-mesh relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-5 pb-20 pt-20 sm:pt-28 lg:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/70 bg-stone-900/70/70 px-3 py-1 text-xs font-semibold text-orange-800 shadow-sm backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-pulse-glow absolute inline-flex h-full w-full rounded-full bg-orange-500" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-600" />
                </span>
                AI collections for service-based SMBs
              </div>
              <h1 className="font-display mt-6 text-5xl font-bold text-stone-100 sm:text-6xl lg:text-7xl">
                Get paid 15 days faster.
                <br />
                <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Without sending a reminder.
                </span>
              </h1>
              <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-stone-400">
                Connect QuickBooks. Claude AI handles every overdue invoice —
                texts, emails, replies, payment plans — all in your voice.
                You sleep. The money still lands.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-stone-900/20 transition hover:bg-orange-700 hover:shadow-xl hover:shadow-stone-900/30"
                >
                  Start free
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <Link
                  href="/demo"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-stone-900/70 px-7 py-3.5 text-base font-semibold text-stone-100 ring-1 ring-inset ring-stone-700 transition hover:ring-stone-600 hover:shadow-md"
                >
                  See live demo
                  <ArrowRight
                    className="h-4 w-4 text-stone-500 transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-stone-500">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-orange-600" />
                  No credit card
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-orange-600" />
                  60-second setup
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-orange-600" />
                  Cancel anytime
                </span>
              </div>
            </div>

            {/* Product mockup card */}
            <div className="relative mx-auto mt-16 max-w-5xl">
              <div className="absolute -inset-x-8 -inset-y-4 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-orange-200/40 via-amber-200/30 to-rose-200/30 blur-2xl" />
              <div className="overflow-hidden rounded-2xl bg-stone-900/70 shadow-2xl shadow-stone-900/10 ring-1 ring-stone-800/80">
                <div className="flex items-center gap-1.5 border-b border-stone-800 bg-stone-950/80 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-3 font-mono text-[11px] text-stone-500">
                    app.invoicechase.com/dashboard
                  </span>
                </div>
                <ProductMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust strip — clean static logo grid ──────────────────── */}
        <section className="border-y border-stone-800 bg-stone-900/70 py-14">
          <div className="mx-auto max-w-6xl px-5 lg:px-6">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Connects with the tools your business already runs on
            </p>
            <div className="mt-8 grid grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-4 lg:grid-cols-8">
              {INTEGRATIONS.map((it) => (
                <div
                  key={it.name}
                  className="flex flex-col items-center justify-center gap-2 opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
                  title={it.name}
                >
                  <it.Logo size={28} />
                  <span className="text-[11px] font-semibold text-stone-400">
                    {it.name.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Live counter — billion-dollar trust signal ─────────────── */}
        <section className="bg-orange-600 py-16 text-white">
          <div className="mx-auto max-w-6xl px-5 lg:px-6">
            <div className="text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-pulse-glow absolute inline-flex h-full w-full rounded-full bg-orange-400" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-300" />
                </span>
                Live · collected this quarter
              </p>
              <p className="font-display mt-6 text-6xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
                <LiveCounter
                  seed={4_182_300}
                  perSecond={11}
                  className="bg-gradient-to-r from-orange-300 via-orange-100 to-amber-200 bg-clip-text text-transparent tabular-nums"
                />
              </p>
              <p className="mt-4 text-base text-stone-400">
                Total collected by SMBs running Invoice Chase right now.
              </p>
            </div>
          </div>
        </section>

        {/* ── Metrics ────────────────────────────────────────────────── */}
        <section className="bg-stone-900/70 py-20">
          <div className="mx-auto max-w-6xl px-5 lg:px-6">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                The cashflow math
              </p>
              <h2 className="font-display mx-auto mt-3 max-w-3xl text-4xl font-bold text-stone-100 sm:text-5xl">
                Built to move every dollar you&apos;re owed —{" "}
                <span className="text-stone-400">faster.</span>
              </h2>
            </div>
            <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-stone-200 sm:grid-cols-2 lg:grid-cols-4">
              <AnimatedMetric
                animated={{ to: 30, suffix: "" }}
                prefix="15–"
                unit="days"
                label="Typical DSO drop in month one"
              />
              <AnimatedMetric
                animated={{ to: 94, suffix: "%" }}
                unit=""
                label="SMS open rate vs 22% email"
              />
              <AnimatedMetric
                animated={{ to: 30, suffix: "s" }}
                unit=""
                label="To text every overdue customer"
              />
              <MetricCard
                value="24/7"
                unit=""
                label="Claude AI on-call replies"
              />
            </div>
          </div>
        </section>

        {/* ── Testimonials ───────────────────────────────────────────── */}
        <section className="bg-stone-950 py-24">
          <div className="mx-auto max-w-6xl px-5 lg:px-6">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                What owners say
              </p>
              <h2 className="font-display mx-auto mt-3 max-w-3xl text-4xl font-bold text-stone-100 sm:text-5xl">
                The boring software that <em className="not-italic text-orange-600">finally</em>{" "}
                paid for itself.
              </h2>
            </div>
            <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.author}
                  className="flex flex-col rounded-2xl bg-stone-900/70 p-7 shadow-sm ring-1 ring-stone-800 transition hover:shadow-lg"
                >
                  <div className="flex gap-0.5 text-orange-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        viewBox="0 0 20 20"
                        className="h-4 w-4 fill-current"
                        aria-hidden
                      >
                        <path d="M10 1.5l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L4.5 18.2l1-6L1.2 7.9l6.1-.9z" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="font-display mt-5 flex-1 text-lg leading-7 text-stone-200">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-stone-800/60 pt-5">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.avatarGrad} text-sm font-bold text-white`}
                    >
                      {t.initials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-stone-100">
                        {t.author}
                      </p>
                      <p className="text-xs text-stone-500">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ── Product / How it works ─────────────────────────────────── */}
        <section id="product" className="bg-stone-950 py-24">
          <div className="mx-auto max-w-6xl px-5 lg:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                How it works
              </p>
              <h2 className="font-display mt-3 text-4xl font-bold text-stone-100 sm:text-5xl">
                Set it up once. Watch the deposits land.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-stone-400">
                The average service-based SMB carries{" "}
                <strong className="text-stone-100">$30k–$300k</strong> of
                unpaid invoices at any time. We compress that timeline so the
                cash you&apos;re owed actually shows up in your bank.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                {
                  step: 1,
                  title: "Connect your accounting",
                  body: "60-second OAuth. Customers, invoices, and payments populate your dashboard instantly — no CSVs, no daily babysitting.",
                },
                {
                  step: 2,
                  title: "Hit Text with AI",
                  body: "One click texts every overdue customer a personalized reminder with a Stripe pay link. They tap, pay, and it posts back to QuickBooks automatically.",
                },
                {
                  step: 3,
                  title: "Claude handles the rest",
                  body: "Customers reply at 11pm with questions, plan requests, complaints. Claude answers in your voice, with the customer's exact balance and history.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="group relative overflow-hidden rounded-2xl bg-stone-900/70 p-7 shadow-sm ring-1 ring-stone-800 transition hover:shadow-lg hover:ring-stone-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 text-base font-bold text-white shadow-sm">
                      {s.step}
                    </span>
                    <h3 className="font-display text-xl font-semibold text-stone-100">
                      {s.title}
                    </h3>
                  </div>
                  <p className="mt-4 text-[15px] leading-7 text-stone-400">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features grid ──────────────────────────────────────────── */}
        <section id="features" className="bg-stone-900/70 py-24">
          <div className="mx-auto max-w-6xl px-5 lg:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                Everything in the box
              </p>
              <h2 className="font-display mt-3 text-4xl font-bold text-stone-100 sm:text-5xl">
                A complete AR platform. One price.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-stone-400">
                Nothing here is an add-on, an extra seat fee, or a higher tier.
                Every feature for $49/month + 1.9% on collected payments.
              </p>
            </div>
            <div className="stagger-children mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const a = ACCENT_CLASSES[f.accent];
                return (
                  <div
                    key={f.title}
                    className="card-hover group flex flex-col rounded-2xl bg-stone-900/70 p-6 shadow-sm ring-1 ring-stone-800 hover:ring-stone-700"
                  >
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${a.bg} ring-1 ring-inset ${a.ring} transition group-hover:scale-110`}
                    >
                      <f.icon className={`h-4 w-4 ${a.text}`} aria-hidden />
                    </span>
                    <h3 className="font-display mt-5 text-base font-semibold text-stone-100">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-400">
                      {f.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Reputation ─────────────────────────────────────────────── */}
        <section
          id="reputation"
          className="border-y border-stone-800 bg-stone-950 py-24"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2 lg:items-start lg:gap-16 lg:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                Reputation scoring
              </p>
              <h2 className="font-display mt-3 text-4xl font-bold text-stone-100 sm:text-5xl">
                Know who&apos;s going to pay you.
                <br />
                <span className="text-stone-400">Before they don&apos;t.</span>
              </h2>
              <p className="mt-6 text-lg leading-8 text-stone-400">
                Every customer gets a 300–850 score — exactly like a personal
                credit score, but private to you. Computed from their payment
                history: on-time rate, average days late, 60+ day incidents,
                and current open balance.
              </p>
              <ul className="mt-8 space-y-4 text-[15px] leading-7 text-stone-300">
                {[
                  "Bulk-text the riskiest customers first — sorted automatically.",
                  "Auto-collect deposits from low-rep customers before you do the work.",
                  "Make data-driven payment terms instead of universal Net-30.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-2xl bg-stone-900/70 shadow-xl shadow-stone-900/5 ring-1 ring-stone-800">
              <div className="border-b border-stone-800 bg-stone-900/40 px-6 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Reputation tiers
                </p>
                <p className="mt-0.5 text-sm font-semibold text-stone-100">
                  How we map score → action
                </p>
              </div>
              <div className="divide-y divide-stone-800">
                {reputationTiers.map((t) => (
                  <div
                    key={t.range}
                    className="flex items-center gap-4 px-6 py-4 transition hover:bg-stone-900/40"
                  >
                    <span className="font-mono text-xs tabular-nums text-stone-500">
                      {t.range}
                    </span>
                    <span className={`h-1.5 w-12 rounded-full ${t.color}`} />
                    <span className="text-sm font-semibold text-stone-100">
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────── */}
        <section id="pricing" className="bg-stone-900/70 py-24">
          <div className="mx-auto max-w-3xl px-5 lg:px-6">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                Pricing
              </p>
              <h2 className="font-display mt-3 text-4xl font-bold text-stone-100 sm:text-5xl">
                One plan. Everything included.
              </h2>
              <p className="mt-4 text-lg text-stone-400">
                Cancel anytime. No contracts, no exit fees.
              </p>
            </div>
            <div className="relative mt-12">
              <div className="absolute -inset-0.5 rounded-[1.6rem] bg-gradient-to-br from-orange-400 via-orange-600 to-amber-600 opacity-60 blur-md" />
              <div className="relative overflow-hidden rounded-3xl bg-stone-900/70 p-8 shadow-2xl shadow-orange-900/10 ring-1 ring-stone-800 sm:p-10">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                      Invoice Chase
                    </p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-display text-6xl font-bold tracking-tight text-stone-100">
                        $49
                      </span>
                      <span className="text-lg text-stone-500">/month</span>
                    </div>
                    <p className="mt-2 text-sm text-stone-400">
                      Plus 1.9% on each payment we collect for you.
                    </p>
                  </div>
                  <Link
                    href="/login"
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-stone-900/20 transition hover:bg-orange-700 hover:shadow-xl"
                  >
                    Start free
                    <ArrowRight
                      className="h-4 w-4 transition group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </div>
                <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {pricingFeatures.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-stone-300"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-orange-600"
                        aria-hidden
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-stone-800/60 pt-6 text-[11px] text-stone-500">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
                    SOC 2 posture
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-orange-600" />
                    Encrypted at rest
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-orange-600" />
                    Stripe-secured payments
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────── */}
        <section className="bg-stone-950 py-24">
          <div className="mx-auto max-w-3xl px-5 lg:px-6">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                Frequently asked
              </p>
              <h2 className="font-display mt-3 text-4xl font-bold text-stone-100 sm:text-5xl">
                Questions, answered.
              </h2>
            </div>
            <dl className="mt-12 space-y-3">
              {faq.map((item) => (
                <div
                  key={item.q}
                  className="group rounded-2xl bg-stone-900/70 p-6 ring-1 ring-stone-800 transition hover:shadow-sm"
                >
                  <dt className="font-display text-base font-semibold text-stone-100">
                    {item.q}
                  </dt>
                  <dd className="mt-2 text-[15px] leading-7 text-stone-400">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────── */}
        <section className="bg-dark-mesh relative overflow-hidden">
          <div className="mx-auto max-w-4xl px-5 py-24 text-center lg:px-6">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              Stop chasing. Start collecting.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-stone-300">
              Connect QuickBooks in 60 seconds and let Claude handle the
              follow-up. Sleep through the 11pm reply storm.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-orange-900/30 transition hover:bg-orange-500 hover:shadow-2xl"
              >
                Start free
                <ArrowRight
                  className="h-4 w-4 transition group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white/90 ring-1 ring-inset ring-white/20 transition hover:bg-stone-900/70/5 hover:text-white"
              >
                See live demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-800 bg-stone-900/70">
        <div className="mx-auto max-w-6xl px-5 py-14 lg:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <BrandMark size={20} />
                <span className="font-display text-base font-bold tracking-tight text-stone-100">
                  Invoice Chase<span className="text-orange-600">.</span>
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-6 text-stone-400">
                AI-powered AR for service-based SMBs. Built on Claude, Stripe,
                and your existing accounting tools.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                { href: "/demo", label: "Demo" },
                { href: "#features", label: "Features" },
                { href: "#reputation", label: "Reputation" },
                { href: "#pricing", label: "Pricing" },
                { href: "/changelog", label: "Changelog" },
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { href: "/help", label: "Help & docs" },
                { href: "/partners", label: "Partner program" },
                { href: "/integrations/quickbooks", label: "QuickBooks app" },
                { href: "/status", label: "System status" },
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
              ]}
            />
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-stone-800 pt-6 text-xs text-stone-500">
            <span>&copy; {new Date().getFullYear()} Invoice Chase, Inc.</span>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
                SOC 2 posture
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-orange-600" />
                Encrypted at rest
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-stone-400 transition hover:text-stone-100"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricCard({
  value,
  unit,
  label,
}: {
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <div className="bg-stone-900/70 px-7 py-9 transition hover:bg-stone-900/40">
      <p className="font-display text-5xl font-bold tracking-tight text-stone-100 sm:text-6xl">
        {value}
        {unit ? (
          <span className="ml-1.5 text-2xl font-semibold text-stone-400 sm:text-3xl">
            {unit}
          </span>
        ) : null}
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-400">{label}</p>
    </div>
  );
}

function AnimatedMetric({
  animated,
  prefix,
  unit,
  label,
}: {
  animated: { to: number; suffix?: string };
  prefix?: string;
  unit: string;
  label: string;
}) {
  return (
    <div className="bg-stone-900/70 px-7 py-9 transition hover:bg-stone-900/40">
      <p className="font-display text-5xl font-bold tracking-tight text-stone-100 sm:text-6xl">
        {prefix ?? ""}
        <AnimatedCounter
          to={animated.to}
          suffix={animated.suffix ?? ""}
          className="tabular-nums"
        />
        {unit ? (
          <span className="ml-1.5 text-2xl font-semibold text-stone-400 sm:text-3xl">
            {unit}
          </span>
        ) : null}
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-400">{label}</p>
    </div>
  );
}

// ── Product mockup ────────────────────────────────────────────────────────

function ProductMockup() {
  return (
    <div className="grid grid-cols-1 gap-0 bg-stone-900/30 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden border-r border-stone-800 bg-stone-900/70 p-5 lg:block">
        <div className="flex items-center gap-2">
          <BrandMark size={18} />
          <span className="text-sm font-semibold text-stone-100">
            Honest Plumbing
          </span>
        </div>
        <nav className="mt-6 space-y-0.5 text-sm">
          {[
            { label: "Dashboard", active: true },
            { label: "Customers" },
            { label: "Inbox", badge: 3 },
            { label: "Payments" },
            { label: "Forecast" },
            { label: "Settings" },
          ].map((t) => (
            <div
              key={t.label}
              className={`flex items-center justify-between rounded-md px-3 py-1.5 ${
                t.active
                  ? "bg-orange-600 font-semibold text-white"
                  : "text-stone-400"
              }`}
            >
              <span>{t.label}</span>
              {t.badge ? (
                <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-semibold text-white">
                  {t.badge}
                </span>
              ) : null}
            </div>
          ))}
        </nav>
      </aside>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-4">
          <MockStat label="Outstanding" value="$54,820" />
          <MockStat label="Overdue customers" value="14" />
          <MockStat label="Avg days late" value="21" unit="days" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="rgb(245 245 244)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="rgb(249 115 22)"
                    strokeWidth="10"
                    strokeDasharray="263.9"
                    strokeDashoffset="73.9"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-bold tabular-nums text-stone-100">
                    72
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  Pulse score
                </p>
                <p className="text-sm font-semibold text-orange-700">
                  Healthy ·{" "}
                  <span className="text-orange-600">+8 this week</span>
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              <Sparkles className="h-2.5 w-2.5 text-orange-600" /> Today&apos;s
              plays
            </p>
            <ul className="mt-2 space-y-1.5 text-xs">
              <MockPlay rank={1} name="Riverside Diner" action="Text" amount="$4,200" />
              <MockPlay rank={2} name="Brown & Co" action="Email" amount="$2,825" />
            </ul>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-stone-800 bg-stone-900/70">
          {[
            { name: "Riverside Diner", days: 47, amt: "$4,200", rep: 612 },
            { name: "Wells Brothers HVAC", days: 21, amt: "$1,850", rep: 480 },
            { name: "Cedar Park Schools", days: 8, amt: "$14,500", rep: 760 },
          ].map((r, i) => (
            <div
              key={r.name}
              className={`flex items-center gap-3 px-4 py-3 text-sm ${i > 0 ? "border-t border-stone-800/60" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-stone-100">{r.name}</p>
                <p className="text-[11px] text-stone-500">{r.days}d overdue</p>
              </div>
              <span className="text-xs font-semibold tabular-nums text-stone-300">
                {r.amt}
              </span>
              <RepBadge score={r.rep} />
              <button className="inline-flex h-7 items-center gap-1 rounded-md bg-orange-600 px-2.5 text-[11px] font-semibold text-white">
                <CreditCard className="h-3 w-3" /> Pay
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p className="font-display mt-1 text-2xl font-bold tabular-nums text-stone-100">
        {value}
        {unit ? (
          <span className="ml-1 text-xs font-normal text-stone-500">
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}

function MockPlay({
  rank,
  name,
  action,
  amount,
}: {
  rank: number;
  name: string;
  action: string;
  amount: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-600 text-[9px] font-bold text-white">
        {rank}
      </span>
      <span className="truncate font-medium text-stone-100">{name}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-700">
        {action}
      </span>
      <span className="ml-auto text-[11px] font-semibold tabular-nums text-orange-700">
        ~{amount}
      </span>
    </li>
  );
}

function RepBadge({ score }: { score: number }) {
  const color =
    score >= 740
      ? "bg-emerald-500"
      : score >= 670
        ? "bg-amber-500"
        : score >= 580
          ? "bg-orange-500"
          : "bg-red-500";
  return (
    <span className="hidden items-center gap-1.5 sm:inline-flex">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="font-mono text-[11px] tabular-nums text-stone-500">
        {score}
      </span>
    </span>
  );
}
