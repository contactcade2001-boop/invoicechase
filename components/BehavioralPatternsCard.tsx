import Link from "next/link";
import { Lightbulb, Sparkles } from "lucide-react";
import type { Pattern, PatternsResult } from "@/lib/server/insights/patterns";

const CONFIDENCE_STYLE: Record<
  Pattern["confidence"],
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
    classes: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

function relativeAge(ms: number): string {
  const ageHr = Math.floor((Date.now() - ms) / 3_600_000);
  if (ageHr < 1) return "fresh";
  if (ageHr < 24) return `${ageHr}h ago`;
  return `${Math.floor(ageHr / 24)}d ago`;
}

export function BehavioralPatternsCard({
  result,
}: {
  result: PatternsResult;
}) {
  if (result.patterns.length === 0) return null;
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Lightbulb className="h-3 w-3" aria-hidden /> What we noticed
            {result.source === "claude" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <Sparkles className="h-2.5 w-2.5" aria-hidden /> AI
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Daily patterns spotted in your customer data — refreshed every
            24h.
          </p>
        </div>
        <p className="text-[10px] text-slate-400">
          {relativeAge(result.generatedAt)}
        </p>
      </div>
      <ul className="mt-4 space-y-2">
        {result.patterns.map((p, i) => {
          const conf = CONFIDENCE_STYLE[p.confidence];
          return (
            <li
              key={`${p.customerId ?? "org"}-${i}`}
              className="rounded-xl border border-slate-200 bg-slate-50/40 p-3"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                  <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    {p.customerName && p.customerId ? (
                      <Link
                        href={`/dashboard/customer/${p.customerId}`}
                        className="text-xs font-semibold text-slate-900 underline-offset-2 hover:underline"
                      >
                        {p.customerName}
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Org-wide
                      </span>
                    )}
                    <span
                      className={`ml-auto inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${conf.classes}`}
                    >
                      {conf.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
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
