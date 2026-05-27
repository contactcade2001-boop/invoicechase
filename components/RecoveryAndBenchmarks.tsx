import { ArrowDownRight, ArrowUpRight, BarChart3, Target } from "lucide-react";
import type { Benchmark } from "@/lib/server/insights/benchmarks";
import { dsoVerdict } from "@/lib/server/insights/benchmarks";
import type { RecoveryStats } from "@/lib/server/insights/recoveryStats";

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const VERDICT_STYLE: Record<
  "best" | "good" | "average" | "behind",
  { label: string; classes: string }
> = {
  best: {
    label: "Elite",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  good: {
    label: "Above average",
    classes: "bg-lime-50 text-lime-700 ring-lime-200",
  },
  average: {
    label: "Average",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  behind: {
    label: "Behind",
    classes: "bg-red-50 text-red-700 ring-red-200",
  },
};

export function RecoveryAndBenchmarks({
  recovery,
  benchmark,
  yourDso,
}: {
  recovery: RecoveryStats;
  benchmark: Benchmark;
  yourDso: number;
}) {
  const verdict = dsoVerdict(yourDso, benchmark);
  const style = VERDICT_STYLE[verdict.label];
  const delta = recovery.deltaPct;
  const up = delta != null && delta >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Recovery MoM */}
      <section className="rounded-2xl bg-stone-900/70 p-6 shadow-sm ring-1 ring-stone-800">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
          <BarChart3 className="h-3 w-3 text-orange-600" aria-hidden /> Recovery
          this month
        </p>
        <div className="mt-3 flex items-baseline gap-3">
          <p className="font-display text-3xl font-bold tabular-nums text-stone-100">
            {formatCurrency(recovery.thisMonthCents)}
          </p>
          {delta != null ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                up
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-red-50 text-red-700 ring-red-200"
              }`}
            >
              {up ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {up ? "+" : ""}
              {delta.toFixed(0)}% vs last
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          {recovery.thisMonthCount} payment
          {recovery.thisMonthCount === 1 ? "" : "s"} ·{" "}
          {formatCurrency(recovery.lastMonthCents)} last month
        </p>
      </section>

      {/* Benchmark */}
      <section className="rounded-2xl bg-stone-900/70 p-6 shadow-sm ring-1 ring-stone-800">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
          <Target className="h-3 w-3 text-orange-600" aria-hidden /> How you
          compare
        </p>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <div>
            <p className="font-display text-3xl font-bold tabular-nums text-stone-100">
              {yourDso}
              <span className="ml-1 text-base font-normal text-stone-500">
                days
              </span>
            </p>
            <p className="text-xs text-stone-500">Your DSO</p>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${style.classes}`}
          >
            {style.label}
          </span>
        </div>
        <p className="mt-3 text-sm text-stone-300">{verdict.copy}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-stone-500">
          <div className="flex items-baseline justify-between gap-2">
            <dt>Top 10% {benchmark.industry.toLowerCase()}</dt>
            <dd className="font-semibold tabular-nums text-stone-300">
              {benchmark.dsoTopDecile}d
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt>Median {benchmark.industry.toLowerCase()}</dt>
            <dd className="font-semibold tabular-nums text-stone-300">
              {benchmark.dsoMedian}d
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
