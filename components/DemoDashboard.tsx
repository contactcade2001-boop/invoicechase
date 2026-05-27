"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  Check,
  CreditCard,
  Gauge,
  LineChart,
  Mail,
  MessageSquare,
  RefreshCcw,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
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

export function DemoDashboard({ businessName }: { businessName: string }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [payModal, setPayModal] = useState<Customer | null>(null);
  const [refreshedAt, setRefreshedAt] = useState(Date.now());

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

  // Mocked 4-week forecast
  const forecastWeeks = useMemo(() => {
    return [
      { label: "This wk", value: 31500 * 100 },
      { label: "Next wk", value: 18200 * 100 },
      { label: "+2 wks", value: 24800 * 100 },
      { label: "+3 wks", value: 9700 * 100 },
    ];
  }, []);
  const forecast4Total = forecastWeeks.reduce((s, w) => s + w.value, 0);
  const maxForecastBar = Math.max(1, ...forecastWeeks.map((w) => w.value));

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

  function onPay(c: Customer) {
    setPayModal(c);
  }
  function onText(c: Customer) {
    if (!c.phone) {
      pushToast("No phone on file", `${c.name} has no number — try email instead.`);
      return;
    }
    pushToast(
      `Would text ${c.name}`,
      `Preview: "${previewText(c)}"`,
    );
  }
  function onEmail(c: Customer) {
    if (!c.email) {
      pushToast("No email on file", `${c.name} has no email — try SMS instead.`);
      return;
    }
    pushToast(`Would email ${c.email}`, "Branded reminder with your logo + Pay Now link.");
  }
  function onBulkText() {
    if (overdueWithPhone === 0) {
      pushToast("Nothing to send", "No overdue customers with phone numbers.");
      return;
    }
    pushToast(
      `Would text ${overdueWithPhone} customers`,
      `Each gets a personalized message + payment link. Claude AI handles any replies in your voice.`,
    );
  }
  function onBulkEmail() {
    if (overdueWithEmail === 0) {
      pushToast("Nothing to send", "No overdue customers with email.");
      return;
    }
    pushToast(
      `Would email ${overdueWithEmail} customers`,
      `Each gets a branded reminder with a one-click Pay Now button.`,
    );
  }
  function onRefresh() {
    setRefreshedAt(Date.now());
    pushToast("Refreshed (demo)", "In real life this re-pulls from QuickBooks/Xero/Jobber.");
  }

  return (
    <>
      {/* Stats header */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            {businessName}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
            Sample data · not your customers
          </span>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:divide-x sm:divide-slate-100">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total outstanding
            </p>
            <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
              {formatCurrencyDetailed(totalOwed)}
            </p>
          </div>
          <div className="sm:pl-6">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Overdue customers
            </p>
            <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
              {counts.overdue}
            </p>
          </div>
          <div className="sm:pl-6">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Avg days late
            </p>
            <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
              {dso}
              <span className="ml-1.5 text-base font-normal text-slate-500">
                days
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Aging breakdown */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Aging breakdown
          </h2>
          <p className="text-xs text-slate-500">
            {formatCurrencyDetailed(agingGrand)} outstanding
          </p>
        </div>
        <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
          {BUCKETS.map((b) => {
            const value = agingTotals[b.key];
            if (value === 0) return null;
            const pct = (value / agingGrand) * 100;
            return (
              <div
                key={b.key}
                className={b.color}
                style={{ width: `${pct}%` }}
                title={`${b.label}: ${formatCurrencyDetailed(value)}`}
              />
            );
          })}
        </div>
        <dl className="mt-4 grid grid-cols-5 gap-2 text-center">
          {BUCKETS.map((b) => (
            <div key={b.key}>
              <dt className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <span className={`h-1.5 w-1.5 rounded-full ${b.color}`} aria-hidden />
                {b.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                {formatCurrencyDetailed(agingTotals[b.key])}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Refresh row */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>
          Last synced{" "}
          {Math.floor((Date.now() - refreshedAt) / 1000) < 5
            ? "just now"
            : `${Math.floor((Date.now() - refreshedAt) / 1000)}s ago`}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
        >
          <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
          Refresh
        </button>
      </div>

      {/* Filter + bulk actions */}
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onBulkEmail}
            disabled={overdueWithEmail === 0}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Email with AI ({overdueWithEmail})
          </button>
          <button
            type="button"
            onClick={onBulkText}
            disabled={overdueWithPhone === 0}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Text with AI ({overdueWithPhone})
          </button>
        </div>
      </div>

      {/* Customer table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(200px,auto)] items-center gap-4 border-b border-slate-200 bg-slate-50/60 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:grid">
          <div>Customer</div>
          <div className="text-right">Amount owed</div>
          <div className="text-right">Status</div>
          <div className="text-right">Actions</div>
        </div>
        {visible.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No customers match this filter.
          </div>
        ) : (
          visible.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-4 transition hover:bg-slate-50/40 last:border-b-0 md:grid-cols-[minmax(0,2.4fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(200px,auto)] md:items-center md:gap-4 md:px-6"
            >
              <div className="flex flex-col gap-1.5 md:min-w-0">
                <span className="truncate font-medium text-slate-900">
                  {c.name}
                </span>
                <ReputationMeter score={c.reputationScore} />
              </div>
              <div className="flex flex-col md:items-end">
                <span className="text-lg font-semibold tabular-nums text-slate-900">
                  {formatCurrency(c.amountOwed)}
                </span>
              </div>
              <div className="flex flex-col md:items-end">
                <span
                  className={`text-sm font-medium tabular-nums ${
                    c.daysLate > 0 ? "text-red-600" : "text-slate-600"
                  }`}
                >
                  {describeDays(c.daysLate)}
                </span>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <button
                  type="button"
                  onClick={() => onText(c)}
                  aria-label="Text reminder"
                  title="Text reminder"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <MessageSquare className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onEmail(c)}
                  aria-label="Email reminder"
                  title="Email reminder"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onPay(c)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Pay now
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Forecast snippet */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <LineChart className="h-3 w-3" aria-hidden /> Forecast preview
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">
              {formatCurrencyDetailed(forecast4Total)}
              <span className="ml-1.5 text-sm font-normal text-slate-500">
                expected next 4 weeks
              </span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <Banknote className="h-3 w-3" aria-hidden />
            Sample projection
          </span>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-3">
          {forecastWeeks.map((w) => {
            const pct = (w.value / maxForecastBar) * 100;
            return (
              <div key={w.label} className="flex flex-col items-center">
                <div className="flex h-16 w-full items-end">
                  <div
                    className="w-full rounded bg-emerald-500/80"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] font-mono text-slate-500">
                  {w.label}
                </p>
                <p className="text-xs font-semibold tabular-nums text-slate-700">
                  {formatCurrencyDetailed(w.value)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-slate-900 p-8 text-center text-white">
        <Gauge className="mx-auto h-7 w-7 text-emerald-400" aria-hidden />
        <h2 className="mt-3 text-2xl font-bold tracking-tight">
          Ready to do this with your actual customers?
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Connect QuickBooks, Xero, or Jobber in 60 seconds. Free to try.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
        >
          Start free
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-40 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="overflow-hidden rounded-xl bg-slate-900 p-4 text-white shadow-lg ring-1 ring-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{t.title}</p>
              <button
                type="button"
                onClick={() =>
                  setToasts((prev) => prev.filter((x) => x.id !== t.id))
                }
                aria-label="Dismiss"
                className="text-slate-400 hover:text-white"
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

      {/* Pay Now modal */}
      {payModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPayModal(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Stripe Checkout preview
              </p>
              <button
                type="button"
                onClick={() => setPayModal(null)}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {businessName}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {formatCurrencyDetailed(payModal.amountOwed)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Payment for {payModal.name}
              </p>
              <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Email</span>
                  <span className="font-mono">
                    {payModal.email ?? "you@example.com"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Card</span>
                  <span className="font-mono text-slate-400">
                    •••• •••• •••• ••••
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPayModal(null);
                  pushToast(
                    `Payment received from ${payModal.name}`,
                    `${formatCurrencyDetailed(payModal.amountOwed)} would post back to QuickBooks automatically.`,
                  );
                }}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Check className="h-4 w-4" aria-hidden />
                Pay {formatCurrencyDetailed(payModal.amountOwed)}
              </button>
              <p className="mt-3 text-center text-[11px] text-slate-500">
                Demo · no real charge. Sign up to enable real payments.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Floating extra-features sidebar tip */}
      <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
        <p className="font-semibold text-slate-900">Try the demo:</p>
        <ul className="mt-2 space-y-1 text-xs">
          <li className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            Click any row&apos;s <strong>Pay now</strong> to see the Stripe Checkout preview.
          </li>
          <li className="flex items-start gap-2">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            Click the chat icon for a per-customer text preview.
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            Use the bulk buttons or switch filters — every interaction is live.
          </li>
        </ul>
      </div>
    </>
  );
}
