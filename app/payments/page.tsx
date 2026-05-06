import { Inbox } from "lucide-react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RetrySyncButton } from "@/components/RetrySyncButton";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  listPaymentsForUser,
  summarizePaymentsForUser,
} from "@/lib/server/db/payments";
import {
  getSubscriptionByUserId,
  isActive,
} from "@/lib/server/db/subscriptions";
import type { PaymentRow } from "@/lib/server/db/schema";
import { formatCurrencyDetailed } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    succeeded: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    failed: "bg-red-50 text-red-700 ring-red-200",
    refunded: "bg-slate-100 text-slate-700 ring-slate-200",
    disputed: "bg-red-50 text-red-700 ring-red-200",
  };
  const cls = styles[status] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}

function PaymentRowView({ p }: { p: PaymentRow }) {
  const fee = p.applicationFeeCents ?? 0;
  const net = p.amountCents - fee;
  const needsQboSync = p.status === "succeeded" && !p.qboPaymentId;
  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="px-4 py-3 text-sm text-slate-700">
        {formatDate(p.paidAt ?? p.createdAt)}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-slate-900">
        {p.customerName ?? "Customer"}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-900">
        {formatCurrencyDetailed(p.amountCents)}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-600">
        {fee ? formatCurrencyDetailed(fee) : "—"}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-700">
        {formatCurrencyDetailed(net)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {needsQboSync ? <RetrySyncButton paymentId={p.id} /> : null}
          <StatusBadge status={p.status} />
        </div>
      </td>
    </tr>
  );
}

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isActive(getSubscriptionByUserId(user.id))) redirect("/billing");

  const summary = summarizePaymentsForUser(user.id);
  const rows = listPaymentsForUser(user.id);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader user={user} current="payments" />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 sm:py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="mt-1 text-sm text-slate-600">
            Money collected through Invoice Chase.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              This month
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
              {formatCurrencyDetailed(summary.thisMonthCents)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Lifetime
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
              {formatCurrencyDetailed(summary.lifetimeCents)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {summary.count} payment{summary.count === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Platform fees
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
              {formatCurrencyDetailed(summary.lifetimeFeesCents)}
            </p>
            <p className="mt-1 text-xs text-slate-500">1.9% of collected</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <Inbox className="mx-auto h-8 w-8 text-slate-400" aria-hidden />
            <h2 className="mt-3 text-sm font-semibold text-slate-900">
              No payments yet
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              When a customer pays through one of your payment links, it&apos;ll
              show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Fee</th>
                  <th className="px-4 py-3 text-right">Net</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <PaymentRowView key={p.id} p={p} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
