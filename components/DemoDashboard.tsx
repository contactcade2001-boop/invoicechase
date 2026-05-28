"use client";

import { useMemo, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bot,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Cog,
  CreditCard,
  Download,
  FileText,
  Gauge,
  Lightbulb,
  LineChart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plug,
  RefreshCcw,
  Send,
  Sparkles,
  Target,
  TrendingDown,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { Confetti } from "@/components/Confetti";
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
import { ReputationMeter } from "@/components/ReputationMeter";
import { mockCustomers } from "@/lib/mockData";
import {
  applyFilter,
  computeDSO,
  computeTotalOwed,
  describeDays,
  formatCurrency,
  formatCurrencyDetailed,
} from "@/lib/format";
import type { Customer, FilterKey } from "@/lib/types";

type View =
  | "dashboard"
  | "customers"
  | "inbox"
  | "forecast"
  | "communications"
  | "payments"
  | "reports"
  | "settings";
type Toast = { id: number; title: string; body: string };

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "high-risk", label: "High Risk" },
  { key: "low-risk", label: "Low Risk" },
];

const BUCKETS = [
  { key: "current", label: "Current", color: "bg-slate-300" },
  { key: "1-30", label: "1–30", color: "bg-amber-400" },
  { key: "31-60", label: "31–60", color: "bg-orange-500" },
  { key: "61-90", label: "61–90", color: "bg-red-500" },
  { key: "90+", label: "90+", color: "bg-red-700" },
];

function bucketKey(daysLate: number) {
  if (daysLate <= 0) return "current";
  if (daysLate <= 30) return "1-30";
  if (daysLate <= 60) return "31-60";
  if (daysLate <= 90) return "61-90";
  return "90+";
}

// Mock Pulse + Plays + Patterns (mirrors the real /lib/server/insights/* output)
const MOCK_PULSE = {
  score: 72,
  label: "Healthy" as const,
  delta: +8,
  factors: [
    { label: "DSO", value: "21 days", positive: true },
    { label: "Overdue %", value: "27%", positive: true },
    { label: "Top customer concentration", value: "31%", positive: false },
    { label: "Avg reputation", value: "684", positive: true },
  ],
};

type PlayAction =
  | "text"
  | "email"
  | "call"
  | "payment_plan"
  | "deposit"
  | "escalate";

const MOCK_PLAYS: {
  customerName: string;
  action: PlayAction;
  reason: string;
  expectedCents: number;
}[] = [
  {
    customerName: "Riverside Diner",
    action: "text",
    reason: "47 days overdue, reputation 612, replied within 3min last time.",
    expectedCents: 420000,
  },
  {
    customerName: "Brown & Co Construction",
    action: "email",
    reason: "Office-hours payer. Has paid every email reminder within 5 days.",
    expectedCents: 282500,
  },
  {
    customerName: "King's Bakery",
    action: "payment_plan",
    reason: "Owes $5,400 across 3 invoices. Texted 'cashflow tight' last week.",
    expectedCents: 540000,
  },
  {
    customerName: "Wells Brothers HVAC",
    action: "call",
    reason: "Ignored 4 texts + 2 emails. Reputation crashed to 480.",
    expectedCents: 185000,
  },
];

const MOCK_PATTERNS: {
  observation: string;
  confidence: "high" | "medium" | "low";
  customerName?: string;
}[] = [
  {
    customerName: "Riverside Diner",
    observation:
      "Pays within 4 days when texted on a Tuesday — 3 of last 3 invoices.",
    confidence: "high",
  },
  {
    observation:
      "Construction clients pay ~12 days slower than your service clients on average. Consider deposits for jobs >$3k.",
    confidence: "medium",
  },
  {
    observation:
      "23% of overdue invoices were never opened on email. Texts open at 94% — switch your default for >30 day overdue.",
    confidence: "high",
  },
];

const MOCK_CHURN: {
  name: string;
  riskScore: number;
  band: "critical" | "high" | "medium" | "low";
  annualRevenueCents: number;
  replacementCostCents: number;
  revenueAtRiskCents: number;
  reason: string;
}[] = [
  {
    name: "Westshore Hotel Group",
    riskScore: 84,
    band: "critical",
    annualRevenueCents: 4_800_000,
    replacementCostCents: 1_200_000,
    revenueAtRiskCents: 6_444_000,
    reason: "reputation 511 · 35d overdue · large open balance",
  },
  {
    name: "Riverside Diner",
    riskScore: 72,
    band: "high",
    annualRevenueCents: 1_680_000,
    replacementCostCents: 420_000,
    revenueAtRiskCents: 2_520_000,
    reason: "reputation 482 · 47d overdue",
  },
  {
    name: "Harbor Auto Repair",
    riskScore: 68,
    band: "high",
    annualRevenueCents: 920_000,
    replacementCostCents: 230_000,
    revenueAtRiskCents: 1_263_000,
    reason: "reputation 428 · 61d overdue",
  },
  {
    name: "Bayside Brewing Co.",
    riskScore: 79,
    band: "critical",
    annualRevenueCents: 624_000,
    replacementCostCents: 156_000,
    revenueAtRiskCents: 936_000,
    reason: "reputation 384 · 92d overdue",
  },
  {
    name: "Cobalt Marketing Agency",
    riskScore: 41,
    band: "medium",
    annualRevenueCents: 1_584_000,
    replacementCostCents: 396_000,
    revenueAtRiskCents: 2_178_000,
    reason: "reputation 612 · 28d overdue",
  },
];

// Mock template gallery for Communications view
const TEMPLATES: {
  id: string;
  tone: string;
  channel: "sms" | "email";
  preview: string;
  voice: string;
  best: string;
}[] = [
  {
    id: "friendly-sms",
    tone: "Friendly nudge",
    channel: "sms",
    voice: "Casual, first-name",
    best: "1–14 days late",
    preview:
      "Hey Maria! Quick reminder your $1,240 invoice is just a few days past due — here's a 1-tap pay link: invoicechase.com/p/x9",
  },
  {
    id: "professional-email",
    tone: "Professional",
    channel: "email",
    voice: "Formal, branded",
    best: "1–30 days late",
    preview:
      "Hi Maria,\n\nA gentle reminder that invoice #4218 ($1,240) is now 8 days past due. You can pay securely here in under 30 seconds: [Pay Now]\n\nThanks,\nMaria",
  },
  {
    id: "field-service-sms",
    tone: "Field service",
    channel: "sms",
    voice: "Trade-specific, direct",
    best: "Any age",
    preview:
      "Hi Maria — Bob from Honest Plumbing here. Quick note: your $1,240 invoice from the 8/14 service call is still open. Pay anytime: invoicechase.com/p/x9",
  },
  {
    id: "warm-email",
    tone: "Warm follow-up",
    channel: "email",
    voice: "Empathetic, brand-led",
    best: "Long-time customer",
    preview:
      "Hi Maria,\n\nHope you're doing well! Just circling back on invoice #4218 — totally get it if things have been busy. Whenever you're ready: [Pay Now]\n\nNo rush,\nMaria",
  },
  {
    id: "firm-sms",
    tone: "Firm reminder",
    channel: "sms",
    voice: "Direct, deadline-focused",
    best: "30–60 days late",
    preview:
      "Maria, your $1,240 invoice is now 47 days past due. We need this resolved this week. Pay now or set up a plan: invoicechase.com/p/x9",
  },
  {
    id: "brief-sms",
    tone: "Ultra-brief",
    channel: "sms",
    voice: "1-liner, no fluff",
    best: "All ages",
    preview: "Maria — $1,240 due. invoicechase.com/p/x9",
  },
];

const MOCK_PAYMENTS: {
  customer: string;
  amount: number;
  fee: number;
  date: string;
  source: "sms" | "email" | "manual";
}[] = [
  {
    customer: "Riverside Diner",
    amount: 420000,
    fee: 8400,
    date: "Today · 2:14 PM",
    source: "sms",
  },
  {
    customer: "Brown & Co Construction",
    amount: 282500,
    fee: 5650,
    date: "Today · 9:02 AM",
    source: "email",
  },
  {
    customer: "Sunrise Café",
    amount: 90000,
    fee: 1800,
    date: "Yesterday",
    source: "sms",
  },
  {
    customer: "Cedar Park Schools",
    amount: 1450000,
    fee: 29000,
    date: "2 days ago",
    source: "manual",
  },
  {
    customer: "Bell Auto Body",
    amount: 312000,
    fee: 6240,
    date: "3 days ago",
    source: "email",
  },
];

const MOCK_PLANS: {
  customer: string;
  total: number;
  installmentCents: number;
  paidWeeks: number;
  totalWeeks: number;
}[] = [
  {
    customer: "King's Bakery",
    total: 540000,
    installmentCents: 135000,
    paidWeeks: 2,
    totalWeeks: 4,
  },
  {
    customer: "Lone Star Floral",
    total: 168000,
    installmentCents: 42000,
    paidWeeks: 3,
    totalWeeks: 4,
  },
];

// Mock inbox thread — what an autopilot conversation looks like
const INBOX_MESSAGES = [
  {
    from: "Riverside Diner",
    direction: "in" as const,
    body: "got the text — when's this due exactly? we're a bit tight this week",
    time: "11:42 PM",
  },
  {
    from: "You (autopilot)",
    direction: "out" as const,
    body: "Hi Riverside! Your $4,200 balance was due 47 days ago. We totally get cashflow timing — would a 4-week payment plan work? I can set you up in 30 seconds.",
    time: "11:42 PM",
    ai: true,
  },
  {
    from: "Riverside Diner",
    direction: "in" as const,
    body: "yeah honestly that would be perfect, ~$1k/week works",
    time: "11:44 PM",
  },
  {
    from: "You (autopilot)",
    direction: "out" as const,
    body: "Perfect. The business owner will set that up tomorrow and send you 4 separate pay links. Anything urgent on your end?",
    time: "11:44 PM",
    ai: true,
  },
  {
    from: "Riverside Diner",
    direction: "in" as const,
    body: "no that's great, thank you!",
    time: "11:45 PM",
  },
] as const;

export function DemoDashboard({ businessName }: { businessName: string }) {
  const [view, setView] = useState<View>("dashboard");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [payModal, setPayModal] = useState<Customer | null>(null);
  const [refreshedAt, setRefreshedAt] = useState(Date.now());
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const customers = mockCustomers;
  const totalOwed = computeTotalOwed(customers);
  const dso = computeDSO(customers);

  const counts: Record<FilterKey, number> = useMemo(
    () => ({
      all: applyFilter(customers, "all").length,
      overdue: applyFilter(customers, "overdue").length,
      "high-risk": applyFilter(customers, "high-risk").length,
      "low-risk": applyFilter(customers, "low-risk").length,
    }),
    [customers],
  );

  const visible = useMemo(
    () => applyFilter(customers, filter),
    [customers, filter],
  );
  const overdue = useMemo(
    () => applyFilter(customers, "overdue"),
    [customers],
  );
  const overdueWithPhone = overdue.filter((c) => c.phone).length;
  const overdueWithEmail = overdue.filter((c) => c.email).length;

  const agingTotals = useMemo(() => {
    const t: Record<string, number> = {
      current: 0,
      "1-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0,
    };
    for (const c of customers) {
      if (c.amountOwed <= 0) continue;
      t[bucketKey(c.daysLate)] += c.amountOwed;
    }
    return t;
  }, [customers]);
  const agingGrand = Object.values(agingTotals).reduce((s, v) => s + v, 0);

  const forecastWeeks = useMemo(
    () => [
      { label: "This wk", value: 3_150_000 },
      { label: "Next wk", value: 1_820_000 },
      { label: "+2 wks", value: 2_480_000 },
      { label: "+3 wks", value: 970_000 },
    ],
    [],
  );
  const forecast4Total = forecastWeeks.reduce((s, w) => s + w.value, 0);
  const maxForecastBar = Math.max(1, ...forecastWeeks.map((w) => w.value));

  // Generate 13-week forecast for the forecast view
  const forecast13 = useMemo(() => {
    const weeks: { label: string; in: number; out: number }[] = [];
    const today = new Date();
    for (let i = 0; i < 13; i++) {
      const d = new Date(today.getTime() + i * 7 * 86400000);
      // Synthetic but realistic pattern
      const inflow =
        Math.round(28000 + Math.sin(i * 0.7) * 9000 + (i < 5 ? 4000 : 0)) * 100;
      const outflow = 18000 * 100;
      weeks.push({
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        in: inflow,
        out: outflow,
      });
    }
    return weeks;
  }, []);
  const maxBar13 = Math.max(
    1,
    ...forecast13.map((w) => Math.max(w.in, w.out)),
  );

  function pushToast(title: string, body: string) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, body }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }

  function previewText(c: Customer): string {
    return `${businessName}: ${formatCurrencyDetailed(c.amountOwed)} past due. Pay: invoicechase.com/pay/abc123`;
  }

  const handlers = {
    pay: (c: Customer) => setPayModal(c),
    text: (c: Customer) => {
      if (!c.phone) {
        pushToast(
          "No phone on file",
          `${c.name} has no number — try email instead.`,
        );
        return;
      }
      pushToast(`Would text ${c.name}`, `Preview: "${previewText(c)}"`);
    },
    email: (c: Customer) => {
      if (!c.email) {
        pushToast(
          "No email on file",
          `${c.name} has no email — try SMS instead.`,
        );
        return;
      }
      pushToast(
        `Would email ${c.email}`,
        "Branded reminder with your logo + Pay Now link.",
      );
    },
    bulkText: () => {
      if (overdueWithPhone === 0) {
        pushToast("Nothing to send", "No overdue customers with phone.");
        return;
      }
      pushToast(
        `Would text ${overdueWithPhone} customers`,
        "Each gets a personalized message. Claude AI handles any replies in your voice.",
      );
    },
    bulkEmail: () => {
      if (overdueWithEmail === 0) {
        pushToast("Nothing to send", "No overdue customers with email.");
        return;
      }
      pushToast(
        `Would email ${overdueWithEmail} customers`,
        "Each gets a branded reminder with a one-click Pay Now button.",
      );
    },
    refresh: () => {
      setRefreshedAt(Date.now());
      pushToast(
        "Refreshed (demo)",
        "In real life this re-pulls from QuickBooks/Xero/Jobber.",
      );
    },
  };

  return (
    <>
      <Confetti trigger={confettiTrigger} />
      <ViewTabs view={view} onChange={setView} />

      {view === "dashboard" ? (
        <DashboardView
          businessName={businessName}
          totalOwed={totalOwed}
          dso={dso}
          counts={counts}
          agingTotals={agingTotals}
          agingGrand={agingGrand}
          refreshedAt={refreshedAt}
          filter={filter}
          setFilter={setFilter}
          visible={visible}
          overdueWithPhone={overdueWithPhone}
          overdueWithEmail={overdueWithEmail}
          forecastWeeks={forecastWeeks}
          forecast4Total={forecast4Total}
          maxForecastBar={maxForecastBar}
          handlers={handlers}
          onSeeForecast={() => setView("forecast")}
        />
      ) : view === "customers" ? (
        <CustomersView customers={customers} handlers={handlers} />
      ) : view === "inbox" ? (
        <InboxView pushToast={pushToast} />
      ) : view === "communications" ? (
        <CommunicationsView pushToast={pushToast} />
      ) : view === "payments" ? (
        <PaymentsView pushToast={pushToast} />
      ) : view === "reports" ? (
        <ReportsView
          agingTotals={agingTotals}
          agingGrand={agingGrand}
          pushToast={pushToast}
        />
      ) : view === "settings" ? (
        <SettingsView pushToast={pushToast} />
      ) : (
        <ForecastView
          businessName={businessName}
          weeks={forecast13}
          maxBar={maxBar13}
        />
      )}

      {/* Sticky CTA */}
      <section className="rounded-2xl bg-slate-900 p-8 text-center text-white shadow-lg ring-1 ring-white/5">
        <Gauge className="mx-auto h-7 w-7 text-emerald-400" aria-hidden />
        <h2 className="mt-3 text-2xl font-bold tracking-tight">
          Ready to do this with your real customers?
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Connect QuickBooks, Xero, or Jobber in 60 seconds. Free to try.
        </p>
        <Link
          href="/login"
          className="group mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-base font-semibold text-stone-900 shadow-sm transition hover:bg-slate-100 hover:shadow-md"
        >
          Start free
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </section>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-40 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="overflow-hidden rounded-xl bg-slate-900 p-4 text-white shadow-xl ring-1 ring-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{t.title}</p>
              <button
                type="button"
                onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
                aria-label="Dismiss"
                className="text-stone-500 transition hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-300">{t.body}</p>
            <p className="mt-2 text-[11px] text-amber-200">
              Demo · sign up to send this for real
            </p>
          </div>
        ))}
      </div>

      {/* Pay modal */}
      {payModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setPayModal(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Stripe Checkout preview
              </p>
              <button
                type="button"
                onClick={() => setPayModal(null)}
                aria-label="Close"
                className="text-stone-500 transition hover:text-stone-700"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {businessName}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {formatCurrencyDetailed(payModal.amountOwed)}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Payment for {payModal.name}
              </p>
              <div className="mt-5 space-y-2 rounded-xl bg-white p-4 text-xs ring-1 ring-inset ring-stone-200">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Email</span>
                  <span className="font-mono">
                    {payModal.email ?? "you@example.com"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Card</span>
                  <span className="font-mono text-stone-500">
                    •••• •••• •••• ••••
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPayModal(null);
                  setConfettiTrigger((t) => t + 1);
                  pushToast(
                    `Payment received from ${payModal.name}`,
                    `${formatCurrencyDetailed(payModal.amountOwed)} posted to QuickBooks automatically.`,
                  );
                }}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
              >
                <Check className="h-4 w-4" aria-hidden />
                Pay {formatCurrencyDetailed(payModal.amountOwed)}
              </button>
              <p className="mt-3 text-center text-[11px] text-stone-500">
                Demo · no real charge.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

// ── View tab nav ────────────────────────────────────────────────────────────

function ViewTabs({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  const tabs: { key: View; label: string; icon: typeof LineChart }[] = [
    { key: "dashboard", label: "Dashboard", icon: Gauge },
    { key: "customers", label: "Customers", icon: Building2 },
    { key: "inbox", label: "Inbox", icon: MessageSquare },
    { key: "communications", label: "Templates", icon: Sparkles },
    { key: "payments", label: "Payments", icon: Wallet },
    { key: "forecast", label: "Forecast", icon: LineChart },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "settings", label: "Settings", icon: Cog },
  ];
  return (
    <nav
      className="-mx-1 flex flex-wrap gap-1 border-b border-stone-200 pb-0"
      aria-label="Demo views"
    >
      {tabs.map((t) => {
        const active = view === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`group relative inline-flex items-center gap-2 rounded-t-md px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "text-stone-900"
                : "text-stone-500 hover:bg-slate-100/60 hover:text-stone-900"
            }`}
          >
            <t.icon
              className={`h-3.5 w-3.5 transition ${active ? "text-emerald-600" : "text-stone-500 group-hover:text-stone-600"}`}
              aria-hidden
            />
            {t.label}
            <span
              className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full transition ${
                active
                  ? "bg-emerald-600"
                  : "bg-transparent group-hover:bg-slate-200"
              }`}
              aria-hidden
            />
          </button>
        );
      })}
    </nav>
  );
}

// ── Dashboard view ─────────────────────────────────────────────────────────

function DashboardView(props: {
  businessName: string;
  totalOwed: number;
  dso: number;
  counts: Record<FilterKey, number>;
  agingTotals: Record<string, number>;
  agingGrand: number;
  refreshedAt: number;
  filter: FilterKey;
  setFilter: (k: FilterKey) => void;
  visible: Customer[];
  overdueWithPhone: number;
  overdueWithEmail: number;
  forecastWeeks: { label: string; value: number }[];
  forecast4Total: number;
  maxForecastBar: number;
  handlers: {
    pay: (c: Customer) => void;
    text: (c: Customer) => void;
    email: (c: Customer) => void;
    bulkText: () => void;
    bulkEmail: () => void;
    refresh: () => void;
  };
  onSeeForecast: () => void;
}) {
  return (
    <>
      {/* Stats header */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            {props.businessName}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
            Sample data
          </span>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:divide-x sm:divide-stone-100">
          <Stat label="Total outstanding" value={formatCurrencyDetailed(props.totalOwed)} />
          <Stat
            label="Overdue customers"
            value={props.counts.overdue.toString()}
            indent
          />
          <Stat
            label="Avg days late"
            value={`${props.dso}`}
            unit="days"
            indent
          />
        </div>
      </section>

      {/* Pulse */}
      <PulseCard />

      {/* Plays + Patterns side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlaysCard />
        <PatternsCard />
      </div>

      {/* Churn risk */}
      <ChurnRiskCardDemo />

      {/* Aging */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">
            Aging breakdown
          </h2>
          <p className="text-xs text-stone-500">
            {formatCurrencyDetailed(props.agingGrand)} outstanding
          </p>
        </div>
        <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
          {BUCKETS.map((b) => {
            const value = props.agingTotals[b.key];
            if (value === 0) return null;
            const pct = (value / props.agingGrand) * 100;
            return (
              <div
                key={b.key}
                className={`${b.color} transition`}
                style={{ width: `${pct}%` }}
                title={`${b.label}: ${formatCurrencyDetailed(value)}`}
              />
            );
          })}
        </div>
        <dl className="mt-4 grid grid-cols-5 gap-2 text-center">
          {BUCKETS.map((b) => (
            <div key={b.key}>
              <dt className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                <span className={`h-1.5 w-1.5 rounded-full ${b.color}`} aria-hidden />
                {b.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-stone-900">
                {formatCurrencyDetailed(props.agingTotals[b.key])}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Refresh */}
      <div className="flex items-center gap-3 text-xs text-stone-500">
        <span>
          Last synced{" "}
          {Math.floor((Date.now() - props.refreshedAt) / 1000) < 5
            ? "just now"
            : `${Math.floor((Date.now() - props.refreshedAt) / 1000)}s ago`}
        </span>
        <button
          type="button"
          onClick={props.handlers.refresh}
          className="group inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-stone-700 ring-1 ring-inset ring-stone-300 transition hover:bg-white hover:ring-slate-400"
        >
          <RefreshCcw
            className="h-3.5 w-3.5 transition group-hover:rotate-180"
            aria-hidden
          />
          Refresh
        </button>
      </div>

      {/* Filter + bulk */}
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const active = props.filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => props.setFilter(tab.key)}
                className={`group inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-stone-700 ring-1 ring-inset ring-stone-200 hover:bg-white hover:ring-stone-300"
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-stone-600"
                  }`}
                >
                  {props.counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row">
          <button
            type="button"
            onClick={props.handlers.bulkEmail}
            disabled={props.overdueWithEmail === 0}
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-inset ring-stone-300 transition hover:bg-white hover:ring-slate-400 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 transition group-hover:scale-110" aria-hidden />
            Email with AI ({props.overdueWithEmail})
          </button>
          <button
            type="button"
            onClick={props.handlers.bulkText}
            disabled={props.overdueWithPhone === 0}
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-stone-500"
          >
            <Sparkles className="h-4 w-4 transition group-hover:scale-110" aria-hidden />
            Text with AI ({props.overdueWithPhone})
          </button>
        </div>
      </div>

      {/* Customers table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(200px,auto)] items-center gap-4 border-b border-stone-200 bg-stone-50 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500 md:grid">
          <div>Customer</div>
          <div className="text-right">Amount owed</div>
          <div className="text-right">Status</div>
          <div className="text-right">Actions</div>
        </div>
        {props.visible.length === 0 ? (
          <div className="p-10 text-center text-sm text-stone-500">
            No customers match this filter.
          </div>
        ) : (
          props.visible.map((c) => (
            <CustomerRow key={c.id} customer={c} handlers={props.handlers} />
          ))
        )}
      </div>

      {/* Forecast snippet */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <LineChart className="h-3 w-3" aria-hidden /> Forecast preview
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-stone-900">
              {formatCurrencyDetailed(props.forecast4Total)}
              <span className="ml-1.5 text-sm font-normal text-stone-500">
                expected next 4 weeks
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={props.onSeeForecast}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"
          >
            Full 13 weeks
            <ArrowRight
              className="h-3 w-3 transition group-hover:translate-x-0.5"
              aria-hidden
            />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-3">
          {props.forecastWeeks.map((w) => {
            const pct = (w.value / props.maxForecastBar) * 100;
            return (
              <div key={w.label} className="flex flex-col items-center">
                <div className="flex h-16 w-full items-end">
                  <div
                    className="w-full rounded bg-emerald-500/80"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] font-mono text-stone-500">
                  {w.label}
                </p>
                <p className="text-xs font-semibold tabular-nums text-stone-700">
                  {formatCurrencyDetailed(w.value)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  unit,
  indent,
}: {
  label: string;
  value: string;
  unit?: string;
  indent?: boolean;
}) {
  return (
    <div className={indent ? "sm:pl-6" : ""}>
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-stone-900">
        {value}
        {unit ? (
          <span className="ml-1.5 text-base font-normal text-stone-500">
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}

function CustomerRow({
  customer,
  handlers,
}: {
  customer: Customer;
  handlers: {
    pay: (c: Customer) => void;
    text: (c: Customer) => void;
    email: (c: Customer) => void;
  };
}) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-stone-100 px-4 py-4 transition hover:bg-stone-50 last:border-b-0 md:grid-cols-[minmax(0,2.4fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(200px,auto)] md:items-center md:gap-4 md:px-6">
      <div className="flex flex-col gap-1.5 md:min-w-0">
        <span className="truncate font-medium text-stone-900">
          {customer.name}
        </span>
        <ReputationMeter score={customer.reputationScore} />
      </div>
      <div className="flex flex-col md:items-end">
        <span className="text-lg font-semibold tabular-nums text-stone-900">
          {formatCurrency(customer.amountOwed)}
        </span>
      </div>
      <div className="flex flex-col md:items-end">
        <span
          className={`text-sm font-medium tabular-nums ${
            customer.daysLate > 0 ? "text-red-600" : "text-stone-600"
          }`}
        >
          {describeDays(customer.daysLate)}
        </span>
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <button
          type="button"
          onClick={() => handlers.text(customer)}
          aria-label="Text reminder"
          title="Text reminder"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-stone-600 ring-1 ring-inset ring-stone-200 transition hover:bg-white hover:text-stone-900 hover:ring-slate-400"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => handlers.email(customer)}
          aria-label="Email reminder"
          title="Email reminder"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-stone-600 ring-1 ring-inset ring-stone-200 transition hover:bg-white hover:text-stone-900 hover:ring-slate-400"
        >
          <Mail className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => handlers.pay(customer)}
          className="group inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
        >
          <CreditCard className="h-4 w-4 transition group-hover:scale-110" aria-hidden />
          Pay now
        </button>
      </div>
    </div>
  );
}

// ── Customers view ─────────────────────────────────────────────────────────

function CustomersView({
  customers,
  handlers,
}: {
  customers: Customer[];
  handlers: {
    pay: (c: Customer) => void;
    text: (c: Customer) => void;
    email: (c: Customer) => void;
  };
}) {
  const [query, setQuery] = useState("");
  const filtered = customers.filter((c) =>
    query.length === 0 ||
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.phone ?? "").includes(query) ||
    (c.email ?? "").toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="mt-1 text-sm text-stone-600">
            Full directory of everyone who owes you. Search and filter.
          </p>
        </div>
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, email…"
            className="block w-72 rounded-md border-0 bg-white py-2 pl-9 pr-3 text-sm shadow-sm ring-1 ring-inset ring-stone-300 transition focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" aria-hidden />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              <th className="px-5 py-3 text-left">Customer</th>
              <th className="px-5 py-3 text-left">Contact</th>
              <th className="px-5 py-3 text-left">Location</th>
              <th className="px-5 py-3 text-right">Owed</th>
              <th className="px-5 py-3 text-right">Reputation</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="group border-b border-stone-100 transition last:border-b-0 hover:bg-stone-50"
              >
                <td className="px-5 py-4 font-medium text-stone-900 group-hover:underline group-hover:underline-offset-4">
                  {c.name}
                </td>
                <td className="px-5 py-4 text-xs text-stone-600">
                  <div className="space-y-0.5">
                    {c.phone ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-stone-500" aria-hidden />
                        <span>{c.phone}</span>
                      </div>
                    ) : null}
                    {c.email ? (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-stone-500" aria-hidden />
                        <span>{c.email}</span>
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-stone-500">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-stone-500" aria-hidden />
                    <span>Austin, TX</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right tabular-nums">
                  {c.amountOwed > 0 ? (
                    <span
                      className={`font-semibold ${c.daysLate > 0 ? "text-red-700" : "text-stone-900"}`}
                    >
                      {formatCurrency(c.amountOwed)}
                    </span>
                  ) : (
                    <span className="text-stone-500">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <ReputationMeter score={c.reputationScore} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-center text-xs text-stone-500">
        Click any row in the real product to send messages or pull invoices.{" "}
        <span
          className="cursor-pointer text-emerald-700 hover:underline"
          onClick={() => handlers.pay(customers[0])}
        >
          Try a Pay Now preview →
        </span>
      </p>
    </>
  );
}

// ── Inbox view ─────────────────────────────────────────────────────────────

function InboxView({
  pushToast,
}: {
  pushToast: (t: string, b: string) => void;
}) {
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inbox</h2>
        <p className="mt-1 text-sm text-stone-600">
          Every customer reply lands here.{" "}
          <strong>Claude AI handles the back-and-forth in your voice</strong> —
          you only step in when needed.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-stone-900">
              Riverside Diner
            </p>
            <p className="text-xs text-stone-500">+1 (512) 555-0101</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <Sparkles className="h-3 w-3" aria-hidden /> Autopilot on
          </span>
        </div>
        <div className="space-y-3 bg-white/40 p-5">
          {INBOX_MESSAGES.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] ${m.direction === "out" ? "items-end" : "items-start"} flex flex-col`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.direction === "out"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-stone-900 ring-1 ring-stone-200"
                  }`}
                >
                  {m.body}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-stone-500">
                  {"ai" in m && m.ai ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <Bot className="h-2.5 w-2.5" aria-hidden />
                      AI
                    </span>
                  ) : null}
                  <span>
                    {m.from} · {m.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-stone-200 bg-white px-5 py-3">
          <input
            type="text"
            placeholder="Reply manually to pause autopilot for this thread…"
            disabled
            className="flex-1 rounded-md border-0 bg-white px-3 py-2 text-sm text-stone-500 ring-1 ring-inset ring-stone-200"
          />
          <button
            type="button"
            onClick={() =>
              pushToast(
                "Demo only",
                "In the real product this sends the SMS instantly and pauses the autopilot for this thread.",
              )
            }
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            Send
          </button>
        </div>
      </div>
    </>
  );
}

// ── Forecast view ──────────────────────────────────────────────────────────

function ForecastView({
  businessName,
  weeks,
  maxBar,
}: {
  businessName: string;
  weeks: { label: string; in: number; out: number }[];
  maxBar: number;
}) {
  const totalIn = weeks.reduce((s, w) => s + w.in, 0);
  const totalOut = weeks.reduce((s, w) => s + w.out, 0);
  const net = totalIn - totalOut;
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          13-week cash flow forecast
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Projected collections + recurring outflows. {businessName} ends the
          quarter{" "}
          <strong
            className={net >= 0 ? "text-emerald-700" : "text-red-700"}
          >
            {net >= 0 ? "+" : ""}
            {formatCurrencyDetailed(net)}
          </strong>{" "}
          net.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FCard label="Expected in" value={formatCurrencyDetailed(totalIn)} color="emerald" />
        <FCard label="Outflows" value={`−${formatCurrencyDetailed(totalOut)}`} color="slate" />
        <FCard
          label="Net change"
          value={`${net >= 0 ? "+" : ""}${formatCurrencyDetailed(net)}`}
          color={net >= 0 ? "emerald" : "red"}
        />
      </div>
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <h3 className="text-sm font-semibold text-stone-900">
          Weekly net change
        </h3>
        <div className="mt-5 grid grid-cols-13 gap-1">
          {weeks.map((w, i) => {
            const net = w.in - w.out;
            const pct = (Math.abs(net) / maxBar) * 100;
            return (
              <div
                key={i}
                className="flex flex-col items-center"
                title={`${w.label}: ${net >= 0 ? "+" : ""}${formatCurrencyDetailed(net)}`}
              >
                <div className="flex h-24 w-full items-end">
                  <div
                    className={`w-full rounded transition hover:opacity-80 ${
                      net >= 0 ? "bg-emerald-500" : "bg-red-500"
                    }`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] font-mono text-stone-500">
                  {w.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <p className="text-center text-xs text-stone-500">
        In the real product you can input recurring outflows + expected new
        revenue and the forecast updates live.
      </p>
    </>
  );
}

function FCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "emerald" | "slate" | "red";
}) {
  const colors: Record<typeof color, string> = {
    emerald: "text-emerald-700",
    slate: "text-stone-700",
    red: "text-red-700",
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 transition hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${colors[color]}`}>
        {value}
      </p>
    </div>
  );
}

// ── Pulse / Plays / Patterns ───────────────────────────────────────────────

function PulseCard() {
  const score = MOCK_PULSE.score;
  const dashOffset = 282.7 - (score / 100) * 282.7;
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgb(241 245 249)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgb(16 185 129)"
              strokeWidth="8"
              strokeDasharray="282.7"
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold tabular-nums text-stone-900">
              {score}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              {MOCK_PULSE.label}
            </p>
          </div>
        </div>
        <div className="flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Gauge className="h-3 w-3" aria-hidden /> Pulse score
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              +{MOCK_PULSE.delta} this week
            </span>
          </p>
          <p className="mt-1 text-sm leading-6 text-stone-700">
            Your AR is in solid shape. Concentration on your top customer is
            the one yellow flag — diversify renewals.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
            {MOCK_PULSE.factors.map((f) => (
              <div key={f.label} className="flex items-baseline justify-between gap-2">
                <dt className="text-[11px] text-stone-500">{f.label}</dt>
                <dd
                  className={`text-xs font-semibold tabular-nums ${f.positive ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

const PLAY_ACTION_META: Record<
  PlayAction,
  { label: string; Icon: typeof MessageSquare; color: string }
> = {
  text: { label: "Text", Icon: MessageSquare, color: "text-emerald-700" },
  email: { label: "Email", Icon: Mail, color: "text-sky-700" },
  call: { label: "Call", Icon: Phone, color: "text-violet-700" },
  payment_plan: {
    label: "Payment plan",
    Icon: CalendarClock,
    color: "text-amber-700",
  },
  deposit: { label: "Deposit", Icon: Banknote, color: "text-emerald-700" },
  escalate: { label: "Escalate", Icon: AlertOctagon, color: "text-red-700" },
};

function PlaysCard() {
  const totalExpected = MOCK_PLAYS.reduce((s, p) => s + p.expectedCents, 0);
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Target className="h-3 w-3" aria-hidden /> Today&apos;s plays
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <Sparkles className="h-2.5 w-2.5" aria-hidden /> AI
            </span>
          </p>
          <p className="mt-1 text-sm text-stone-700">
            {MOCK_PLAYS.length} actions · {formatCurrencyDetailed(totalExpected)}{" "}
            potential cash unlocked
          </p>
        </div>
        <p className="text-[10px] text-stone-500">2m ago</p>
      </div>
      <ol className="mt-4 space-y-2">
        {MOCK_PLAYS.map((p, i) => {
          const meta = PLAY_ACTION_META[p.action];
          return (
            <li
              key={i}
              className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-white/40 p-3 transition hover:bg-white hover:shadow-sm"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-semibold text-stone-900 transition group-hover:underline group-hover:underline-offset-4">
                    {p.customerName}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${meta.color}`}
                  >
                    <meta.Icon className="h-3 w-3" aria-hidden />
                    {meta.label}
                  </span>
                  <span className="ml-auto text-xs font-semibold tabular-nums text-emerald-700">
                    ~{formatCurrencyDetailed(p.expectedCents)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-stone-600">{p.reason}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const CONFIDENCE_STYLE: Record<
  "high" | "medium" | "low",
  { label: string; classes: string }
> = {
  high: {
    label: "High confidence",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  medium: {
    label: "Medium",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  low: {
    label: "Speculative",
    classes: "bg-slate-100 text-stone-600 ring-stone-200",
  },
};

function PatternsCard() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Lightbulb className="h-3 w-3" aria-hidden /> What we noticed
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <Sparkles className="h-2.5 w-2.5" aria-hidden /> AI
            </span>
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Daily patterns spotted in your customer data — refreshed every 24h.
          </p>
        </div>
        <p className="text-[10px] text-stone-500">5h ago</p>
      </div>
      <ul className="mt-4 space-y-2">
        {MOCK_PATTERNS.map((p, i) => {
          const conf = CONFIDENCE_STYLE[p.confidence];
          return (
            <li
              key={i}
              className="rounded-xl border border-stone-200 bg-white/40 p-3 transition hover:bg-white"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                  <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    {p.customerName ? (
                      <span className="text-xs font-semibold text-stone-900">
                        {p.customerName}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                        Org-wide
                      </span>
                    )}
                    <span
                      className={`ml-auto inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${conf.classes}`}
                    >
                      {conf.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-stone-700">
                    {p.observation}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Churn risk card (demo) ─────────────────────────────────────────────────

const CHURN_BAND_STYLE: Record<
  "critical" | "high" | "medium" | "low",
  { label: string; classes: string; dot: string }
> = {
  critical: {
    label: "Critical",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
  high: {
    label: "High",
    classes: "bg-orange-50 text-orange-700 ring-orange-200",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
};

function ChurnRiskCardDemo() {
  const total = MOCK_CHURN.reduce((s, c) => s + c.revenueAtRiskCents, 0);
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <TrendingDown className="h-3 w-3 text-red-600" aria-hidden />{" "}
            Customers at risk of churning
          </p>
          <p className="mt-1 text-sm text-stone-700">
            <strong className="text-stone-900">
              {formatCurrencyDetailed(total)}
            </strong>{" "}
            in annual revenue + replacement cost lost if these{" "}
            {MOCK_CHURN.length} go to a competitor.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
          <AlertTriangle className="h-3 w-3" aria-hidden /> Retention
        </span>
      </div>
      <ol className="mt-4 space-y-2">
        {MOCK_CHURN.map((c, i) => {
          const band = CHURN_BAND_STYLE[c.band];
          return (
            <li
              key={i}
              className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-white/40 p-3 transition hover:bg-white hover:shadow-sm"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-semibold text-stone-900 transition group-hover:underline group-hover:underline-offset-4">
                    {c.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${band.classes}`}
                  >
                    <span className={`h-1 w-1 rounded-full ${band.dot}`} />
                    {band.label} · {c.riskScore}
                  </span>
                  <span className="ml-auto text-xs font-semibold tabular-nums text-red-700">
                    −{formatCurrencyDetailed(c.revenueAtRiskCents)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-stone-600">
                  {c.reason}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-stone-500">
                  <span>
                    Annual:{" "}
                    <span className="font-semibold tabular-nums text-stone-700">
                      {formatCurrencyDetailed(c.annualRevenueCents)}
                    </span>
                  </span>
                  <span>
                    Replace cost:{" "}
                    <span className="font-semibold tabular-nums text-stone-700">
                      {formatCurrencyDetailed(c.replacementCostCents)}
                    </span>
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-[11px] text-stone-500">
        Risk = reputation gap + days late + open balance pressure. Revenue at
        risk = trailing-12mo + 25% CAC + current open balance.
      </p>
    </section>
  );
}

// ── Communications view ────────────────────────────────────────────────────

function CommunicationsView({
  pushToast,
}: {
  pushToast: (t: string, b: string) => void;
}) {
  const [active, setActive] = useState(TEMPLATES[0].id);
  const template = TEMPLATES.find((t) => t.id === active) ?? TEMPLATES[0];
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Communication templates
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          One-tap presets your AI can use. Pick a tone — Claude personalizes
          each message per customer.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-2">
          {TEMPLATES.map((t) => {
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                className={`group flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  isActive
                    ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-200"
                    : "border-stone-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    t.channel === "sms"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-sky-100 text-sky-700"
                  }`}
                >
                  {t.channel === "sms" ? (
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-stone-900">
                      {t.tone}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-stone-500">
                      {t.channel}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {t.voice} · best for {t.best}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {template.channel === "sms" ? "SMS preview" : "Email preview"}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <Sparkles className="h-2.5 w-2.5" aria-hidden /> Personalized by AI
            </span>
          </div>
          <div className="mt-4 rounded-xl bg-white p-5 ring-1 ring-inset ring-stone-200">
            {template.channel === "email" ? (
              <div className="mb-3 border-b border-stone-200 pb-3">
                <p className="text-[10px] uppercase tracking-wider text-stone-500">
                  Subject
                </p>
                <p className="text-sm font-semibold text-stone-900">
                  Invoice #4218 — quick reminder
                </p>
              </div>
            ) : null}
            <p className="whitespace-pre-line text-sm leading-6 text-stone-700">
              {template.preview}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              pushToast(
                "Template saved as default",
                `"${template.tone}" will be used for new ${template.channel === "sms" ? "SMS" : "email"} reminders.`,
              )
            }
            className="group mt-5 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md"
          >
            <CheckCircle2 className="h-4 w-4 transition group-hover:scale-110" aria-hidden />
            Use as default
          </button>
        </div>
      </div>
    </>
  );
}

// ── Payments view ──────────────────────────────────────────────────────────

function PaymentsView({
  pushToast,
}: {
  pushToast: (t: string, b: string) => void;
}) {
  const totalCollected = MOCK_PAYMENTS.reduce((s, p) => s + p.amount, 0);
  const totalFees = MOCK_PAYMENTS.reduce((s, p) => s + p.fee, 0);
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
        <p className="mt-1 text-sm text-stone-600">
          Every dollar that came in via Pay Now links. Auto-reconciled to
          QuickBooks.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FCard
          label="Last 7 days"
          value={formatCurrencyDetailed(totalCollected)}
          color="emerald"
        />
        <FCard
          label="Stripe fees"
          value={`−${formatCurrencyDetailed(totalFees)}`}
          color="slate"
        />
        <FCard
          label="Net to bank"
          value={formatCurrencyDetailed(totalCollected - totalFees)}
          color="emerald"
        />
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              <th className="px-5 py-3 text-left">Customer</th>
              <th className="px-5 py-3 text-left">Triggered by</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-right">Fee</th>
              <th className="px-5 py-3 text-right">When</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PAYMENTS.map((p, i) => (
              <tr
                key={i}
                className="group border-b border-stone-100 transition last:border-b-0 hover:bg-stone-50"
              >
                <td className="px-5 py-3.5 font-medium text-stone-900 group-hover:underline group-hover:underline-offset-4">
                  {p.customer}
                </td>
                <td className="px-5 py-3.5 text-xs">
                  {p.source === "sms" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <MessageSquare className="h-2.5 w-2.5" aria-hidden /> SMS
                    </span>
                  ) : p.source === "email" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
                      <Mail className="h-2.5 w-2.5" aria-hidden /> Email
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-stone-600">
                      Manual
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right text-sm font-semibold tabular-nums text-emerald-700">
                  +{formatCurrency(p.amount)}
                </td>
                <td className="px-5 py-3.5 text-right text-xs tabular-nums text-stone-500">
                  −{formatCurrency(p.fee)}
                </td>
                <td className="px-5 py-3.5 text-right text-xs text-stone-500">
                  {p.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <CalendarClock className="h-3 w-3" aria-hidden /> Active payment
              plans
            </p>
            <p className="mt-1 text-sm text-stone-700">
              {MOCK_PLANS.length} customers paying in installments
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              pushToast(
                "Demo only",
                "In the real product you can build a custom plan from any overdue invoice in 30 seconds.",
              )
            }
            className="group inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            New plan
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {MOCK_PLANS.map((p, i) => {
            const pct = (p.paidWeeks / p.totalWeeks) * 100;
            return (
              <div
                key={i}
                className="rounded-xl border border-stone-200 bg-white/40 p-4 transition hover:bg-white"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-stone-900">{p.customer}</p>
                  <p className="text-sm tabular-nums text-stone-700">
                    {formatCurrencyDetailed(p.installmentCents)}
                    <span className="text-xs text-stone-500"> / week · {p.totalWeeks} wks</span>
                  </p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-stone-500">
                  {p.paidWeeks} of {p.totalWeeks} installments paid ·{" "}
                  {formatCurrencyDetailed(p.total - p.paidWeeks * p.installmentCents)}{" "}
                  remaining
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

// ── Reports view ───────────────────────────────────────────────────────────

function ReportsView({
  agingTotals,
  agingGrand,
  pushToast,
}: {
  agingTotals: Record<string, number>;
  agingGrand: number;
  pushToast: (t: string, b: string) => void;
}) {
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports & exports</h2>
        <p className="mt-1 text-sm text-stone-600">
          Aging snapshots, reconciliation CSVs, and IRS-ready year-end exports.
          Built for your accountant.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ReportTile
          icon={FileText}
          title="AR aging report"
          body="Detailed breakdown by bucket and customer."
          format="CSV · PDF"
          onClick={() =>
            pushToast(
              "Aging report ready",
              "Would download a CSV with every customer, days late, and amount.",
            )
          }
        />
        <ReportTile
          icon={Wallet}
          title="Payment reconciliation"
          body="Every Stripe payment matched to its invoice."
          format="CSV"
          onClick={() =>
            pushToast(
              "Reconciliation ready",
              "Would download a QuickBooks-compatible CSV of all Stripe → invoice matches.",
            )
          }
        />
        <ReportTile
          icon={LineChart}
          title="13-week forecast"
          body="Reputation-weighted cash projection."
          format="CSV · PDF"
          onClick={() =>
            pushToast(
              "Forecast exported",
              "Would download a 13-week cash projection ready for your CFO.",
            )
          }
        />
        <ReportTile
          icon={Sparkles}
          title="AI activity log"
          body="Every autopilot message + reply sent this month."
          format="CSV"
          onClick={() =>
            pushToast(
              "Activity log ready",
              "Would download every autopilot SMS + email + reply for the month.",
            )
          }
        />
        <ReportTile
          icon={Gauge}
          title="Customer reputation"
          body="Reputation scores + history for every customer."
          format="CSV"
          onClick={() =>
            pushToast(
              "Reputation export ready",
              "Would download the 300–850 score for each customer + 90-day trend.",
            )
          }
        />
        <ReportTile
          icon={CalendarClock}
          title="Payment plan tracker"
          body="All active plans + installment status."
          format="CSV"
          onClick={() =>
            pushToast(
              "Plan tracker ready",
              "Would download every active plan with progress + remaining balance.",
            )
          }
        />
      </div>
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <h3 className="text-sm font-semibold text-stone-900">
          AR aging snapshot
        </h3>
        <p className="mt-1 text-xs text-stone-500">
          {formatCurrencyDetailed(agingGrand)} outstanding across {BUCKETS.length}{" "}
          buckets
        </p>
        <div className="mt-4 space-y-2.5">
          {BUCKETS.map((b) => {
            const value = agingTotals[b.key];
            const pct = agingGrand > 0 ? (value / agingGrand) * 100 : 0;
            return (
              <div key={b.key} className="flex items-center gap-3">
                <div className="flex w-24 items-center gap-2 text-xs text-stone-600">
                  <span className={`h-2 w-2 rounded-full ${b.color}`} aria-hidden />
                  {b.label}
                </div>
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full ${b.color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="w-28 text-right text-xs font-semibold tabular-nums text-stone-700">
                  {formatCurrencyDetailed(value)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function ReportTile({
  icon: Icon,
  title,
  body,
  format,
  onClick,
}: {
  icon: typeof FileText;
  title: string;
  body: string;
  format: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-2 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-stone-200 transition hover:shadow-md hover:ring-stone-300"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 transition group-hover:scale-110">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <p className="text-xs text-stone-600">{body}</p>
      <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        <Download className="h-3 w-3" aria-hidden />
        {format}
      </div>
    </button>
  );
}

// ── Settings view (connection tiles) ───────────────────────────────────────

const CONNECTIONS: {
  key: string;
  name: string;
  category: "Accounting" | "Field service" | "Payments";
  Logo: typeof QuickBooksLogo;
  connected: boolean;
  status: string;
}[] = [
  {
    key: "qbo",
    name: "QuickBooks Online",
    category: "Accounting",
    Logo: QuickBooksLogo,
    connected: true,
    status: "Synced 2m ago",
  },
  {
    key: "xero",
    name: "Xero",
    category: "Accounting",
    Logo: XeroLogo,
    connected: false,
    status: "Switch any time",
  },
  {
    key: "jobber",
    name: "Jobber",
    category: "Field service",
    Logo: JobberLogo,
    connected: false,
    status: "Connect for invoices + customers",
  },
  {
    key: "hcp",
    name: "Housecall Pro",
    category: "Field service",
    Logo: HousecallProLogo,
    connected: false,
    status: "Pulls jobs + customer balances",
  },
  {
    key: "st",
    name: "ServiceTitan",
    category: "Field service",
    Logo: ServiceTitanLogo,
    connected: false,
    status: "Enterprise FSM support",
  },
  {
    key: "fp",
    name: "FieldPulse",
    category: "Field service",
    Logo: FieldPulseLogo,
    connected: false,
    status: "API key auth",
  },
  {
    key: "wz",
    name: "Workiz",
    category: "Field service",
    Logo: WorkizLogo,
    connected: false,
    status: "API key auth",
  },
  {
    key: "stripe",
    name: "Stripe Connect",
    category: "Payments",
    Logo: StripeLogo,
    connected: true,
    status: "Express account active",
  },
];

function SettingsView({
  pushToast,
}: {
  pushToast: (t: string, b: string) => void;
}) {
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
        <p className="mt-1 text-sm text-stone-600">
          One-tap OAuth to your accounting + field service tools. Pick one — or
          stack a few.
        </p>
      </div>
      {(["Accounting", "Field service", "Payments"] as const).map((cat) => {
        const tiles = CONNECTIONS.filter((c) => c.category === cat);
        return (
          <section key={cat}>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {cat}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tiles.map((t) => (
                <div
                  key={t.key}
                  className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 transition hover:shadow-md hover:ring-stone-300"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-stone-200">
                      <t.Logo size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-semibold text-stone-900">
                          {t.name}
                        </p>
                        {t.connected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            <CheckCircle2 className="h-2.5 w-2.5" aria-hidden />{" "}
                            Connected
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-stone-500">{t.status}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      pushToast(
                        t.connected
                          ? `Re-syncing ${t.name}`
                          : `Would connect ${t.name}`,
                        t.connected
                          ? "In the real product this pulls fresh invoices in 5–10s."
                          : "Sign up and run a real OAuth handshake — takes ~60s.",
                      )
                    }
                    className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      t.connected
                        ? "bg-slate-100 text-stone-700 hover:bg-slate-200"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {t.connected ? (
                      <>
                        <RefreshCcw className="h-3 w-3 transition group-hover:rotate-180" aria-hidden />
                        Re-sync
                      </>
                    ) : (
                      <>
                        <Plug className="h-3 w-3 transition group-hover:scale-110" aria-hidden />
                        Connect
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
