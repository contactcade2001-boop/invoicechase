import { ArrowRight, Inbox } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RetrySyncButton } from "@/components/RetrySyncButton";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  listPaymentsForOrg,
  summarizePaymentsForOrg,
} from "@/lib/server/db/payments";
import {
  getSubscriptionByOrgId,
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
    refunded: "bg-slate-100 text-stone-700 ring-stone-200",
    partially_refunded: "bg-amber-50 text-amber-700 ring-amber-200",
    disputed: "bg-red-50 text-red-700 ring-red-200",
  };
  const cls = styles[status] ?? "bg-slate-100 text-stone-700 ring-stone-200";
  const label = status === "partially_refunded" ? "partial refund" : status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}

function PaymentRowView({ p }: { p: PaymentRow }) {
  const fee = p.applicationFeeCents ?? 0;
  const refunded = p.refundedAmountCents ?? 0;
  const net = p.amountCents - fee - refunded;
  const needsQboSync = p.status === "succeeded" && !p.qboPaymentId;
  const partial = p.status === "partially_refunded" && refunded > 0;
  return (
    <tr className="border-b border-stone-100 last:border-b-0">
      <td className="px-4 py-3 text-sm text-stone-700">
        {formatDate(p.paidAt ?? p.createdAt)}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-stone-900">
        {p.customerName ?? "Customer"}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-stone-900">
        {formatCurrencyDetailed(p.amountCents)}
        {partial ? (
          <div className="text-[11px] font-normal text-amber-700">
            −{formatCurrencyDetailed(refunded)} refunded
          </div>
        ) : null}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-stone-600">
        {fee ? formatCurrencyDetailed(fee) : "—"}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-stone-700">
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
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/dashboard");
    redirect("/billing");
  }
  if (user.role === "technician") redirect("/dashboard");

  const summary = summarizePaymentsForOrg(orgId);
  const rows = listPaymentsForOrg(orgId);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} current="payments" />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
            <p className="mt-1 text-sm text-stone-600">
              Money collected through Invoice Chase.
            </p>
          </div>
          <Link
            href="/payment-plans"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-white"
          >
            Payment plans
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              This month
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
              {formatCurrencyDetailed(summary.thisMonthCents)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Lifetime
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
              {formatCurrencyDetailed(summary.lifetimeCents)}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {summary.count} payment{summary.count === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Platform fees
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
              {formatCurrencyDetailed(summary.lifetimeFeesCents)}
            </p>
            <p className="mt-1 text-xs text-stone-500">1.9% of collected</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-stone-200">
            <Inbox className="mx-auto h-8 w-8 text-stone-500" aria-hidden />
            <h2 className="mt-3 text-sm font-semibold text-stone-900">
              No payments yet
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              When a customer pays through one of your payment links, it&apos;ll
              show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-white text-xs font-semibold uppercase tracking-wide text-stone-500">
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
