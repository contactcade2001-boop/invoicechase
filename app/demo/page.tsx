import Link from "next/link";
import { ArrowRight, Building2, CreditCard, Mail, MessageSquare, Sparkles } from "lucide-react";
import { AgingBreakdown } from "@/components/AgingBreakdown";
import { ReputationMeter } from "@/components/ReputationMeter";
import { mockBusiness, mockCustomers } from "@/lib/mockData";
import {
  applyFilter,
  computeDSO,
  computeTotalOwed,
  describeDays,
  formatCurrency,
  formatCurrencyDetailed,
} from "@/lib/format";

export const metadata = {
  title: "Live demo — Invoice Chase",
  description:
    "See the Invoice Chase dashboard in action with sample data. No signup needed.",
};

export default function DemoPage() {
  const customers = mockCustomers;
  const totalOwed = computeTotalOwed(customers);
  const dso = computeDSO(customers);
  const overdueCount = applyFilter(customers, "overdue").length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Sticky demo banner */}
      <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm">
        <span className="font-semibold text-amber-900">Live demo</span>
        <span className="text-amber-800">
          {" "}
          — this is sample data. Buttons are non-interactive.
        </span>
        <Link
          href="/login"
          className="ml-2 inline-flex items-center gap-1 font-semibold text-amber-900 underline-offset-2 hover:underline"
        >
          Try with your QuickBooks
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      {/* Fake app header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold text-slate-900">Dashboard</span>
            <span className="text-slate-400">Inbox</span>
            <span className="text-slate-400">Payments</span>
            <span className="text-slate-400">Reports</span>
            <span className="text-slate-400">Forecast</span>
            <Link
              href="/login"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="pointer-events-none mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
        {/* Stats */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            {mockBusiness.name}
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
                {overdueCount}
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

        {/* Aging */}
        <AgingBreakdown customers={customers} />

        {/* Filter + bulk actions */}
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {["All", "Overdue", "High Risk", "Low Risk"].map((label, i) => (
              <span
                key={label}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
                  i === 0
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row">
            <span className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300">
              <Sparkles className="h-4 w-4" aria-hidden />
              Email with AI ({overdueCount})
            </span>
            <span className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden />
              Text with AI ({overdueCount})
            </span>
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
          {customers.slice(0, 8).map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,2.4fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(200px,auto)] md:items-center md:gap-4 md:px-6"
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
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 ring-1 ring-inset ring-slate-200">
                  <MessageSquare className="h-4 w-4" aria-hidden />
                </span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 ring-1 ring-inset ring-slate-200">
                  <Mail className="h-4 w-4" aria-hidden />
                </span>
                <span className="inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white">
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Pay now
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA card */}
        <section className="rounded-2xl bg-slate-900 p-8 text-center text-white shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight">
            Ready to do this with your real customers?
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Connect QuickBooks, Xero, or Jobber in 60 seconds.
          </p>
          <Link
            href="/login"
            className="pointer-events-auto mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
          >
            Start free
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      </main>
    </div>
  );
}
