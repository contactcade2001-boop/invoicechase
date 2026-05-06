import { ArrowRight, Inbox } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { findOrgByPortalSlug } from "@/lib/server/db/organizations";
import { listPaymentsForCustomerEmail } from "@/lib/server/db/payments";
import { getCurrentCustomerEmail } from "@/lib/server/portal/auth";
import { listOutstandingForCustomerEmailInOrg } from "@/lib/server/portal/outstanding";
import { formatCurrencyDetailed } from "@/lib/format";
import { formatRelativeTime } from "@/lib/inboxFormat";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  succeeded: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  refunded: "bg-slate-100 text-slate-700 ring-slate-200",
  partially_refunded: "bg-amber-50 text-amber-700 ring-amber-200",
  disputed: "bg-red-50 text-red-700 ring-red-200",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  const label = status === "partially_refunded" ? "partial refund" : status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}

type Params = Promise<{ slug: string }>;

export default async function BrandedPortalAccountPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const org = findOrgByPortalSlug(slug);
  if (!org) notFound();

  const email = await getCurrentCustomerEmail();
  if (!email) redirect(`/p/${slug}`);

  const [allPayments, outstanding] = await Promise.all([
    Promise.resolve(listPaymentsForCustomerEmail(email, 500)),
    listOutstandingForCustomerEmailInOrg(email, org.id),
  ]);
  // Filter payments to this merchant only.
  const payments = allPayments.filter((p) => p.organizationId === org.id);
  const lifetimeCents = payments
    .filter((p) => p.status === "succeeded")
    .reduce((s, p) => s + p.amountCents - (p.refundedAmountCents ?? 0), 0);

  const accent = org.portalAccentColor ?? "#0f172a";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            href={`/p/${slug}`}
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
            style={{ color: accent }}
          >
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt={org.name} className="h-7 w-auto" />
            ) : null}
            {org.name}
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">{email}</span>
            <form action="/api/portal/logout" method="post">
              <button
                type="submit"
                className="text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Outstanding
            </p>
            <p
              className="mt-2 text-3xl font-bold tracking-tight tabular-nums"
              style={{ color: accent }}
            >
              {formatCurrencyDetailed(outstanding?.totalOpenCents ?? 0)}
            </p>
            {outstanding?.invoices.length ? (
              <p className="mt-1 text-xs text-slate-500">
                {outstanding.invoices.length} open invoice
                {outstanding.invoices.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Lifetime paid (net of refunds)
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
              {formatCurrencyDetailed(lifetimeCents)}
            </p>
          </div>
        </div>

        {outstanding && outstanding.invoices.length > 0 ? (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold tracking-tight">
              Open invoices
            </h2>
            <ul className="mt-4 space-y-1 text-sm">
              {outstanding.invoices.map((inv) => (
                <li
                  key={inv.qboInvoiceId}
                  className="flex items-center justify-between border-t border-slate-100 pt-2 first:border-t-0 first:pt-0"
                >
                  <span className="text-slate-600">
                    {inv.docNumber ? `#${inv.docNumber}` : "Invoice"}
                    {inv.dueDate ? (
                      <span className="text-slate-400">
                        {" "}
                        · due {inv.dueDate}
                      </span>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-slate-700">
                    {formatCurrencyDetailed(inv.balanceCents)}
                  </span>
                </li>
              ))}
            </ul>
            {outstanding.payUrl ? (
              <Link
                href={outstanding.payUrl}
                className="mt-5 inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: accent }}
              >
                Pay now
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </section>
        ) : null}

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            Past payments
          </h2>
          {payments.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <Inbox className="mx-auto h-8 w-8 text-slate-400" aria-hidden />
              <h3 className="mt-3 text-sm font-semibold">No payments yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                When you pay {org.name}, the receipt will show up here.
              </p>
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Refunded</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-4 py-3 text-slate-700">
                        {formatRelativeTime(p.paidAt ?? p.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatCurrencyDetailed(p.amountCents)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                        {(p.refundedAmountCents ?? 0) > 0
                          ? `−${formatCurrencyDetailed(p.refundedAmountCents ?? 0)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
