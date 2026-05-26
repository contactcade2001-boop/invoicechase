"use client";

import { useMemo } from "react";
import type { Customer } from "@/lib/types";
import { formatCurrencyDetailed } from "@/lib/format";

type Bucket = {
  key: string;
  label: string;
  color: string;
  ringColor: string;
};

const BUCKETS: Bucket[] = [
  { key: "current", label: "Current", color: "bg-slate-300", ringColor: "ring-slate-300" },
  { key: "1-30", label: "1–30", color: "bg-amber-400", ringColor: "ring-amber-300" },
  { key: "31-60", label: "31–60", color: "bg-orange-500", ringColor: "ring-orange-300" },
  { key: "61-90", label: "61–90", color: "bg-red-500", ringColor: "ring-red-300" },
  { key: "90+", label: "90+", color: "bg-red-700", ringColor: "ring-red-400" },
];

function bucketKey(daysLate: number): string {
  if (daysLate <= 0) return "current";
  if (daysLate <= 30) return "1-30";
  if (daysLate <= 60) return "31-60";
  if (daysLate <= 90) return "61-90";
  return "90+";
}

export function AgingBreakdown({ customers }: { customers: Customer[] }) {
  const totals = useMemo(() => {
    const map: Record<string, number> = {
      current: 0,
      "1-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0,
    };
    for (const c of customers) {
      if (c.amountOwed <= 0) continue;
      map[bucketKey(c.daysLate)] += c.amountOwed;
    }
    return map;
  }, [customers]);

  const grand = useMemo(
    () => Object.values(totals).reduce((s, v) => s + v, 0),
    [totals],
  );

  if (grand === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Aging breakdown
        </h2>
        <p className="text-xs text-slate-500">
          {formatCurrencyDetailed(grand)} outstanding
        </p>
      </div>
      <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
        {BUCKETS.map((b) => {
          const value = totals[b.key];
          if (value === 0) return null;
          const pct = (value / grand) * 100;
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
              <span
                className={`h-1.5 w-1.5 rounded-full ${b.color}`}
                aria-hidden
              />
              {b.label}
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
              {formatCurrencyDetailed(totals[b.key])}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
