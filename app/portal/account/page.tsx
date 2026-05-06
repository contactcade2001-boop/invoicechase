import { Inbox } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listPaymentsForCustomerEmail } from "@/lib/server/db/payments";
import { getCurrentCustomerEmail } from "@/lib/server/portal/auth";
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

export default async function PortalAccountPage() {
  const email = await getCurrentCustomerEmail();
  if (!email) redirect("/portal");

  const payments = listPaymentsForCustomerEmail(email);
  const lifetimeCents = payments
    .filter((p) => p.status === "succeeded")
    .reduce((s, p) => s + p.amountCents - (p.refundedAmountCents ?? 0), 0);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Your payments
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Every payment you&apos;ve made through Invoice Chase. Lifetime
            net of refunds:{" "}
            <span className="font-semibold text-slate-900">
              {formatCurrencyDetailed(lifetimeCents)}
            </span>
            .
          </p>
        </div>
        {payments.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <Inbox className="mx-auto h-8 w-8 text-slate-400" aria-hidden />
            <h2 className="mt-3 text-sm font-semibold">No payments yet</h2>
            <p className="mt-1 text-sm text-slate-500">
              When you pay through one of your business&apos; payment links,
              the receipt will show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
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
        <p className="text-xs text-slate-500">
          Need a copy of a specific receipt? Reply to the receipt email or
          contact the business directly.
        </p>
      </main>
    </div>
  );
}
