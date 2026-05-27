import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports — Invoice Chase" };

function defaultMonthValue(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "technician") redirect("/dashboard");
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/dashboard");
    redirect("/billing");
  }

  const defaultMonth = defaultMonthValue();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} current="reports" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-slate-600">
          Hand these to your accountant or your bookkeeper. Both exports reflect
          the data we have in QuickBooks + Stripe at the moment of download.
        </p>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold tracking-tight">AR aging</h2>
          <p className="mt-1 text-sm text-slate-600">
            Open invoices grouped into Current / 1–30 / 31–60 / 61–90 / 90+
            day buckets, with totals by bucket.
          </p>
          <a
            href="/api/reports/aging.csv"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <Download className="h-4 w-4" aria-hidden /> Download AR aging CSV
          </a>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold tracking-tight">
            Monthly reconciliation
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Every payment we processed in a given month, including platform
            fees and refunds, with totals — designed to match your Stripe
            payouts at month end.
          </p>
          <form
            action="/api/reports/reconciliation.csv"
            method="get"
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Month
              </span>
              <input
                type="month"
                name="month"
                defaultValue={defaultMonth}
                className="mt-1 block rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <Download className="h-4 w-4" aria-hidden /> Download
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
