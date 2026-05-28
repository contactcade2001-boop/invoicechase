import Link from "next/link";
import { AlertTriangle, TrendingDown, Users } from "lucide-react";
import { formatCurrencyDetailed } from "@/lib/format";
import type {
  ChurnRiskBand,
  ChurnRiskResult,
} from "@/lib/server/insights/churnRisk";

const BAND_STYLE: Record<
  ChurnRiskBand,
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

export function ChurnRiskCard({ result }: { result: ChurnRiskResult }) {
  if (result.topAtRisk.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
          <Users className="h-3 w-3" aria-hidden /> Customers at risk
        </p>
        <p className="mt-3 text-sm text-stone-600">
          Every customer is in good shape. Keep doing what you&apos;re doing.
        </p>
      </section>
    );
  }
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <TrendingDown className="h-3 w-3 text-red-600" aria-hidden />{" "}
            Customers at risk
          </p>
          <p className="mt-1 text-sm text-stone-700">
            <strong className="text-stone-900">
              {formatCurrencyDetailed(result.totalAtRiskCents)}
            </strong>{" "}
            in annual revenue + replacement cost if these{" "}
            {result.topAtRisk.length} leave for a competitor.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
          <AlertTriangle className="h-3 w-3" aria-hidden /> Retention
        </span>
      </div>
      <ol className="mt-4 space-y-2">
        {result.topAtRisk.map((c, i) => {
          const band = BAND_STYLE[c.band];
          return (
            <li
              key={c.id}
              className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-white/40 p-3 transition hover:bg-white hover:shadow-sm"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <Link
                    href={`/dashboard/customer/${c.id}`}
                    className="font-semibold text-stone-900 transition hover:underline group-hover:underline-offset-4"
                  >
                    {c.name}
                  </Link>
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
