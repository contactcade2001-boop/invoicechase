import Link from "next/link";
import { ArrowRight, LineChart } from "lucide-react";
import { computeForecast } from "@/lib/server/forecast/compute";
import { formatCurrencyDetailed } from "@/lib/format";

export async function DashboardForecastSnippet({
  organizationId,
}: {
  organizationId: number;
}) {
  const forecast = await computeForecast(organizationId);
  if (!forecast.connected) return null;

  const next4 = forecast.weeks.slice(0, 4);
  const total4 = next4.reduce(
    (s, w) => s + w.expectedInflows + w.expectedNewRevenue,
    0,
  );
  const maxBar = Math.max(
    1,
    ...next4.map((w) => w.expectedInflows + w.expectedNewRevenue),
  );

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <LineChart className="h-3 w-3" aria-hidden /> Forecast preview
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">
            {formatCurrencyDetailed(total4)}
            <span className="ml-1.5 text-sm font-normal text-slate-500">
              expected next 4 weeks
            </span>
          </p>
        </div>
        <Link
          href="/forecast"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
        >
          Full 13 weeks
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-3">
        {next4.map((w, i) => {
          const value = w.expectedInflows + w.expectedNewRevenue;
          const pct = (value / maxBar) * 100;
          const label = new Date(
            w.weekStart + "T00:00:00Z",
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          });
          return (
            <div key={w.weekStart} className="flex flex-col items-center">
              <div className="flex h-16 w-full items-end">
                <div
                  className="w-full rounded bg-emerald-500/80"
                  style={{ height: `${Math.max(pct, 4)}%` }}
                  title={`Week of ${label}: ${formatCurrencyDetailed(value)}`}
                />
              </div>
              <p className="mt-2 text-[10px] font-mono text-slate-500">
                {i === 0 ? "This wk" : label}
              </p>
              <p className="text-xs font-semibold tabular-nums text-slate-700">
                {formatCurrencyDetailed(value)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
