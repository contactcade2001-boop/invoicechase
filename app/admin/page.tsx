import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/server/auth/session";
import { isAdminEmail } from "@/lib/server/admin/auth";
import { getDb } from "@/lib/server/db/client";
import { listAllOrgs } from "@/lib/server/db/organizations";
import { listRecentWebhookEvents } from "@/lib/server/db/webhookEvents";
import {
  partners,
  partnerCommissions,
  payments,
  subscriptions,
} from "@/lib/server/db/schema";
import { sql } from "drizzle-orm";
import { formatCurrencyDetailed } from "@/lib/format";
import { formatRelativeTime } from "@/lib/inboxFormat";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Invoice Chase" };

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) notFound();

  const db = getDb();
  const orgs = listAllOrgs();
  const subs = db.select().from(subscriptions).all();
  const partnersList = db.select().from(partners).all();
  const recentWebhooks = listRecentWebhookEvents(25);

  const subByOrg = new Map(subs.map((s) => [s.organizationId, s]));
  const activeSubs = subs.filter(
    (s) => s.status === "active" || s.status === "trialing",
  );
  const mrrCents = activeSubs.length * 4900;

  const totalsRow = db
    .select({
      paymentsTotal: sql<number>`COALESCE(SUM(CASE WHEN ${payments.status} = 'succeeded' THEN ${payments.amountCents} ELSE 0 END), 0)`,
      feesTotal: sql<number>`COALESCE(SUM(CASE WHEN ${payments.status} = 'succeeded' THEN COALESCE(${payments.applicationFeeCents}, 0) ELSE 0 END), 0)`,
    })
    .from(payments)
    .get();

  const pendingCommissionsRow = db
    .select({
      total: sql<number>`COALESCE(SUM(${partnerCommissions.commissionCents}), 0)`,
    })
    .from(partnerCommissions)
    .where(sql`${partnerCommissions.status} = 'pending'`)
    .get();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Invoice Chase
            </Link>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-200">
              admin
            </span>
          </div>
          <span className="text-sm text-slate-500">{user.email}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Organizations" value={orgs.length.toString()} />
          <Stat
            label="Active subscriptions"
            value={activeSubs.length.toString()}
          />
          <Stat label="MRR" value={formatCurrencyDetailed(mrrCents)} />
          <Stat
            label="Lifetime payments"
            value={formatCurrencyDetailed(totalsRow?.paymentsTotal ?? 0)}
            sub={`${formatCurrencyDetailed(totalsRow?.feesTotal ?? 0)} platform fees`}
          />
          <Stat label="Partners" value={partnersList.length.toString()} />
          <Stat
            label="Pending commissions"
            value={formatCurrencyDetailed(pendingCommissionsRow?.total ?? 0)}
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Organizations</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Subscription</th>
                  <th className="px-4 py-3 text-left">Settings</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => {
                  const sub = subByOrg.get(o.id);
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {o.name}
                        <span className="ml-2 text-xs text-slate-400">
                          #{o.id}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatRelativeTime(o.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {sub ? sub.status : "—"}
                        {sub?.cancelAtPeriodEnd === 1 ? " (cancelling)" : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {[
                          o.autopilotEnabled === 1 ? "autopilot" : null,
                          o.depositEnabled === 1 ? "deposits" : null,
                          o.customReceiptsEnabled === 1 ? "receipts" : null,
                          o.portalSlug ? `/p/${o.portalSlug}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Partners</h2>
          {partnersList.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No partners yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 text-left">Partner</th>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Stripe</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {partnersList.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {p.displayName ?? p.email}
                        </div>
                        <div className="text-xs text-slate-500">{p.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {p.referralCode}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {p.stripeAccountId ?? "not connected"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            Recent webhook events
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">When</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {recentWebhooks.map((w) => (
                  <tr
                    key={w.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {formatRelativeTime(w.createdAt)}
                    </td>
                    <td className="px-4 py-3">{w.source}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {w.type ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          w.status === "ok"
                            ? "text-emerald-700"
                            : "text-red-700"
                        }
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {w.errorMessage ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}
