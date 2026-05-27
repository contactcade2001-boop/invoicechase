import {
  AlertCircle,
  Inbox,
  Mail,
  MapPin,
  Phone,
  Search,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ReputationMeter } from "@/components/ReputationMeter";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { getDashboardData } from "@/lib/server/qbo/sync";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers — Invoice Chase" };

type SearchParams = Promise<{ q?: string; sort?: string }>;

const SORTS = [
  { key: "name", label: "Name (A–Z)" },
  { key: "amount", label: "Amount owed" },
  { key: "rep", label: "Reputation" },
] as const;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "technician") redirect("/dashboard");
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/dashboard");
    redirect("/billing");
  }

  const data = await getDashboardData(orgId);
  const q = (sp.q ?? "").trim().toLowerCase();
  const sortKey = (sp.sort ?? "amount") as "name" | "amount" | "rep";

  const customers = data.connected
    ? data.customers
        .filter((c) => {
          if (!q) return true;
          return (
            c.name.toLowerCase().includes(q) ||
            (c.email ?? "").toLowerCase().includes(q) ||
            (c.phone ?? "").toLowerCase().includes(q) ||
            (c.address ?? "").toLowerCase().includes(q)
          );
        })
        .sort((a, b) => {
          if (sortKey === "name") return a.name.localeCompare(b.name);
          if (sortKey === "rep") return b.reputationScore - a.reputationScore;
          return b.amountOwed - a.amountOwed;
        })
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader user={user} current="customers" />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="mt-1 text-sm text-slate-600">
              The full directory — search by business name, contact, phone, or
              location. Click any row to see invoices and message history.
            </p>
          </div>
          {data.connected ? (
            <p className="text-xs text-slate-500">
              {customers.length} customer{customers.length === 1 ? "" : "s"}
              {q ? ` matching "${q}"` : ""}
            </p>
          ) : null}
        </div>

        {!data.connected ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <AlertCircle
              className="mx-auto h-8 w-8 text-slate-400"
              aria-hidden
            />
            <h3 className="mt-3 text-sm font-semibold">
              Connect your accounting first
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Customers populate from QuickBooks, Xero, or Jobber. Connect
              from{" "}
              <Link href="/settings" className="underline">
                Settings
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <form action="/customers" method="get" className="flex flex-wrap gap-2">
              <label className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  name="q"
                  defaultValue={sp.q ?? ""}
                  placeholder="Search by name, phone, email, or address"
                  className="block w-full rounded-md border-0 py-2 pl-9 pr-3 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
                />
              </label>
              <select
                name="sort"
                defaultValue={sortKey}
                className="rounded-md border-0 py-2 pl-3 pr-8 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    Sort by {s.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Apply
              </button>
            </form>

            {customers.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
                <Inbox
                  className="mx-auto h-8 w-8 text-slate-400"
                  aria-hidden
                />
                <h3 className="mt-3 text-sm font-semibold">
                  No customers match
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try a broader search or clear the filter.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 text-left">Customer</th>
                      <th className="px-5 py-3 text-left">Contact</th>
                      <th className="px-5 py-3 text-left">Location</th>
                      <th className="px-5 py-3 text-right">Owed</th>
                      <th className="px-5 py-3 text-right">Reputation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50/50"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/dashboard/customer/${c.id}`}
                            className="font-medium text-slate-900 hover:underline"
                          >
                            {c.name}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">
                          <div className="space-y-0.5">
                            {c.phone ? (
                              <div className="flex items-center gap-1.5">
                                <Phone
                                  className="h-3 w-3 text-slate-400"
                                  aria-hidden
                                />
                                <span>{c.phone}</span>
                              </div>
                            ) : null}
                            {c.email ? (
                              <div className="flex items-center gap-1.5">
                                <Mail
                                  className="h-3 w-3 text-slate-400"
                                  aria-hidden
                                />
                                <a
                                  href={`mailto:${c.email}`}
                                  className="truncate hover:underline"
                                >
                                  {c.email}
                                </a>
                              </div>
                            ) : null}
                            {!c.phone && !c.email ? (
                              <span className="text-slate-400">—</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">
                          {c.address ? (
                            <div className="flex items-start gap-1.5">
                              <MapPin
                                className="mt-0.5 h-3 w-3 shrink-0 text-slate-400"
                                aria-hidden
                              />
                              <span>{c.address}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums">
                          {c.amountOwed > 0 ? (
                            <span
                              className={`font-semibold ${
                                c.daysLate > 0
                                  ? "text-red-700"
                                  : "text-slate-900"
                              }`}
                            >
                              {formatCurrency(c.amountOwed)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <ReputationMeter score={c.reputationScore} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
