"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, CalendarClock, CreditCard, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getPayLinkUrl } from "@/app/actions/pay";
import { sendTextToCustomer } from "@/app/actions/sms";
import {
  describeDays,
  formatCurrency,
  formatCurrencyDetailed,
} from "@/lib/format";
import { formatRelativeTime } from "@/lib/inboxFormat";
import type { Customer } from "@/lib/types";
import type { OpenInvoiceLine } from "@/lib/server/qbo/sync";
import { NewPaymentPlanModal } from "./NewPaymentPlanModal";
import { ReputationMeter } from "./ReputationMeter";
import { payErrorMessage, smsErrorMessage } from "./smsErrors";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CustomerDetail({
  customer,
  invoices,
  payLinkViewedAt,
  payLinkViewedCount,
}: {
  customer: Customer;
  invoices: OpenInvoiceLine[];
  payLinkViewedAt?: number | null;
  payLinkViewedCount?: number;
}) {
  const [planOpen, setPlanOpen] = useState(false);
  const [textPending, startText] = useTransition();
  const [payPending, startPay] = useTransition();

  function onText() {
    startText(async () => {
      const r = await sendTextToCustomer(customer.id);
      alert(
        r.ok
          ? `Sent to ${customer.phone || customer.name}.`
          : smsErrorMessage(r.error),
      );
    });
  }

  function onPay() {
    startPay(async () => {
      const r = await getPayLinkUrl(customer.id);
      if (r.ok) window.open(r.url, "_blank", "noopener,noreferrer");
      else alert(payErrorMessage(r.error));
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {customer.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ReputationMeter score={customer.reputationScore} />
              {payLinkViewedAt ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-sky-500"
                    aria-hidden
                  />
                  Pay link opened {formatRelativeTime(payLinkViewedAt)}
                  {payLinkViewedCount && payLinkViewedCount > 1
                    ? ` · ${payLinkViewedCount}×`
                    : ""}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {customer.phone || "No phone on file"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPay}
              disabled={payPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              <CreditCard className="h-4 w-4" aria-hidden />
              {payPending ? "Opening…" : "Pay Now"}
            </button>
            <button
              type="button"
              onClick={onText}
              disabled={textPending || !customer.phone}
              title={!customer.phone ? "No phone on file" : undefined}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              <MessageSquare className="h-4 w-4" aria-hidden />
              {textPending ? "Sending…" : "Text"}
            </button>
            <button
              type="button"
              onClick={() => setPlanOpen(true)}
              disabled={customer.amountOwed <= 0}
              title={
                customer.amountOwed <= 0
                  ? "No outstanding balance"
                  : "Split this balance into installments"
              }
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CalendarClock className="h-4 w-4" aria-hidden />
              Payment plan
            </button>
          </div>
        </div>

        <NewPaymentPlanModal
          open={planOpen}
          onClose={() => setPlanOpen(false)}
          customer={customer}
        />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total owed
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
              {formatCurrencyDetailed(customer.amountOwed)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </p>
            <p
              className={`mt-1 text-base font-semibold tabular-nums ${
                customer.daysLate > 0 ? "text-red-600" : "text-slate-700"
              }`}
            >
              {describeDays(customer.daysLate)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Open invoices
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
              {invoices.length}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Open invoices
        </div>
        {invoices.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No open invoices for this customer.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 text-left">Invoice</th>
                <th className="px-4 py-2 text-left">Issued</th>
                <th className="px-4 py-2 text-left">Due</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-right">Balance</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const overdue = inv.daysLate > 0;
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {inv.number ?? `#${inv.id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {fmtDate(inv.txnDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {fmtDate(inv.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-700">
                      {formatCurrency(inv.totalCents)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-900">
                      {formatCurrency(inv.balanceCents)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-sm tabular-nums ${
                        overdue ? "text-red-600" : "text-slate-600"
                      }`}
                    >
                      {describeDays(inv.daysLate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
