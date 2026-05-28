import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CashflowSettingsForm } from "@/components/CashflowSettingsForm";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getOrgById } from "@/lib/server/db/organizations";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { computeForecast } from "@/lib/server/forecast/compute";
import { formatCurrencyDetailed } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cash flow forecast — Invoice Chase" };

function weekLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function ForecastPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "technician") redirect("/dashboard");
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/dashboard");
    redirect("/billing");
  }
  const forecast = await computeForecast(orgId);
  const org = getOrgById(orgId)!;
  const isOwner = user.role === "owner";

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} current="forecast" />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            13-week cash flow forecast
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Projected collections from your open AR, weighted by each
            customer&apos;s reputation score, plus your recurring outflows
            and expected new revenue. Not GAAP — a planning estimate.
          </p>
        </div>

        {!forecast.connected ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-stone-200">
            <h2 className="text-lg font-semibold">
              Connect your accounting first
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              We need your open invoices to project anything. Connect from{" "}
              <Link href="/settings" className="underline">
                Settings
              </Link>
              .
            </p>
          </div>
        ) : (
          <ForecastContent forecast={forecast} />
        )}

        {isOwner ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <h2 className="text-lg font-semibold tracking-tight">
              Forecast assumptions
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              The forecast above projects AR collections from real invoice
              data. Tell us your recurring costs and expected new revenue to
              turn it into a full cash position.
            </p>
            <div className="mt-5">
              <CashflowSettingsForm
                initial={{
                  monthlyOutflowDollars:
                    org.cashflowMonthlyOutflowCents / 100,
                  monthlyNewInvoicesDollars:
                    org.cashflowMonthlyNewInvoicesCents / 100,
                }}
              />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function ForecastContent({
  forecast,
}: {
  forecast: Extract<
    Awaited<ReturnType<typeof computeForecast>>,
    { connected: true }
  >;
}) {
  const maxAbsNet = Math.max(
    1,
    ...forecast.weeks.map((w) => Math.abs(w.net)),
  );
  const maxRunning = Math.max(
    1,
    ...forecast.weeks.map((w) => Math.abs(w.runningCash)),
  );
  const cashflowAtEnd =
    forecast.weeks[forecast.weeks.length - 1]?.runningCash ?? 0;

  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Stat
          label="Expected collections"
          value={formatCurrencyDetailed(forecast.totals.inflows)}
          sub="Open AR weighted by reputation"
          tone="emerald"
        />
        <Stat
          label="New revenue (est.)"
          value={formatCurrencyDetailed(forecast.totals.newRevenue)}
          sub="From your monthly estimate"
          tone="sky"
        />
        <Stat
          label="Outflows"
          value={`−${formatCurrencyDetailed(forecast.totals.outflows)}`}
          sub="Recurring monthly × 13 weeks"
          tone="slate"
        />
        <Stat
          label="Net 13 weeks"
          value={`${cashflowAtEnd >= 0 ? "+" : ""}${formatCurrencyDetailed(cashflowAtEnd)}`}
          sub="Cumulative change in cash"
          tone={cashflowAtEnd >= 0 ? "emerald" : "red"}
        />
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-sm font-semibold tracking-tight">
          Weekly net change
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Inflows + new revenue − outflows. Bars above the line are
          surplus weeks, below are deficits.
        </p>
        <div className="mt-5 grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5">
          {forecast.weeks.map((w) => {
            const pct = (Math.abs(w.net) / maxAbsNet) * 100;
            const positive = w.net >= 0;
            return (
              <div
                key={w.weekStart}
                className="flex flex-col items-center"
                title={`${weekLabel(w.weekStart)} · net ${formatCurrencyDetailed(w.net)}`}
              >
                <div className="flex h-24 items-end">
                  <div
                    className={`w-6 rounded ${positive ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] font-mono text-stone-500">
                  {weekLabel(w.weekStart)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-sm font-semibold tracking-tight">
          Running cash position
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Cumulative net change from week 0. Starts at $0 — slide the
          curve up by your current bank balance to read absolute cash.
        </p>
        <div className="mt-5 grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5">
          {forecast.weeks.map((w) => {
            const pct = (Math.abs(w.runningCash) / maxRunning) * 100;
            const positive = w.runningCash >= 0;
            return (
              <div
                key={w.weekStart}
                className="flex flex-col items-center"
                title={`${weekLabel(w.weekStart)} · running ${formatCurrencyDetailed(w.runningCash)}`}
              >
                <div className="flex h-24 items-end">
                  <div
                    className={`w-6 rounded ${positive ? "bg-sky-500" : "bg-amber-500"}`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] font-mono text-stone-500">
                  {weekLabel(w.weekStart)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-white text-xs font-semibold uppercase tracking-wide text-stone-500">
              <th className="px-5 py-3 text-left">Week of</th>
              <th className="px-5 py-3 text-right">Collections</th>
              <th className="px-5 py-3 text-right">New rev.</th>
              <th className="px-5 py-3 text-right">Outflows</th>
              <th className="px-5 py-3 text-right">Net</th>
              <th className="px-5 py-3 text-right">Running</th>
            </tr>
          </thead>
          <tbody>
            {forecast.weeks.map((w) => (
              <tr
                key={w.weekStart}
                className="border-b border-stone-100 last:border-b-0"
              >
                <td className="px-5 py-3 font-mono text-xs text-stone-700">
                  {weekLabel(w.weekStart)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-emerald-700">
                  {formatCurrencyDetailed(w.expectedInflows)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-sky-700">
                  {formatCurrencyDetailed(w.expectedNewRevenue)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-stone-500">
                  −{formatCurrencyDetailed(w.expectedOutflows)}
                </td>
                <td
                  className={`px-5 py-3 text-right tabular-nums font-semibold ${
                    w.net >= 0 ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {w.net >= 0 ? "+" : ""}
                  {formatCurrencyDetailed(w.net)}
                </td>
                <td
                  className={`px-5 py-3 text-right tabular-nums ${
                    w.runningCash >= 0 ? "text-stone-900" : "text-red-700"
                  }`}
                >
                  {w.runningCash >= 0 ? "" : ""}
                  {formatCurrencyDetailed(w.runningCash)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "emerald" | "sky" | "slate" | "red";
}) {
  const colors: Record<typeof tone, string> = {
    emerald: "text-emerald-700",
    sky: "text-sky-700",
    slate: "text-stone-700",
    red: "text-red-700",
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-semibold tabular-nums ${colors[tone]}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-stone-500">{sub}</p>
    </div>
  );
}
