import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type {
  CollectedSummary,
  DsoSummary,
  Period,
} from "@/lib/dashboard/types";
import { PeriodToggle } from "./PeriodToggle";

function fmtUsd(cents: number, options: { compact?: boolean } = {}): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    notation: options.compact ? "compact" : "standard",
    maximumFractionDigits: options.compact ? 1 : 0,
  });
}

type Props = {
  period: Period;
  collected: CollectedSummary;
  dso: DsoSummary;
};

export function HeroMetrics({ period, collected, dso }: Props) {
  return (
    <section
      aria-label="Headline metrics"
      className="rounded-mk-xl bg-mk-surface p-6 shadow-mk-1 ring-1 ring-mk-ink-300/60 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="mk-display text-[11px] font-semibold uppercase tracking-[0.18em] text-mk-ink-500">
          {collected.periodLabel}
        </p>
        <PeriodToggle current={period} />
      </div>

      {/* Big collected stat */}
      <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p
          className="mk-display text-[44px] font-bold leading-none tabular-nums text-mk-ink-950 sm:text-[64px]"
          aria-label={`${fmtUsd(collected.totalCents)} collected`}
        >
          {fmtUsd(collected.totalCents)}
        </p>
        <DeltaChip delta={collected.delta} />
      </div>
      <p className="mt-2 text-[13px] text-mk-ink-500">
        {collected.paidInvoiceCount}{" "}
        {collected.paidInvoiceCount === 1 ? "invoice" : "invoices"} paid
      </p>

      <div className="my-7 h-px bg-mk-ink-300/60" />

      {/* DSO stat */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="mk-display text-[32px] font-bold leading-none tabular-nums text-mk-ink-950 sm:text-[40px]">
          {dso.currentDays}
          <span className="ml-1.5 text-[15px] font-semibold text-mk-ink-500">
            days to pay
          </span>
        </p>
        {dso.improvementDays != null && dso.improvementDays > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-mk-full bg-mk-accent-50 px-2 py-0.5 text-[11px] font-semibold text-mk-accent-700">
            <ArrowDownRight className="h-3 w-3" />
            down from {dso.baselineDays}
          </span>
        ) : dso.baselineDays != null ? (
          <span className="inline-flex items-center gap-1 rounded-mk-full bg-mk-ink-100 px-2 py-0.5 text-[11px] font-semibold text-mk-ink-700">
            baseline {dso.baselineDays}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[13px] text-mk-ink-500">
        Average days from invoice to payment
      </p>
    </section>
  );
}

function DeltaChip({
  delta,
}: {
  delta: { pct: number | null; direction: "up" | "down" | "flat" };
}) {
  if (delta.pct == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-mk-full bg-mk-ink-100 px-2 py-0.5 text-[11px] font-semibold text-mk-ink-700">
        <Minus className="h-3 w-3" /> baseline period
      </span>
    );
  }
  const positive = delta.direction === "up";
  const cls = positive
    ? "bg-mk-accent-50 text-mk-accent-700"
    : delta.direction === "down"
      ? "bg-mk-primary-50 text-mk-primary-700"
      : "bg-mk-ink-100 text-mk-ink-700";
  const Icon = positive
    ? ArrowUpRight
    : delta.direction === "down"
      ? ArrowDownRight
      : Minus;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-mk-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}
    >
      <Icon className="h-3 w-3" />
      {positive ? "+" : ""}
      {delta.pct}% vs prior
    </span>
  );
}
