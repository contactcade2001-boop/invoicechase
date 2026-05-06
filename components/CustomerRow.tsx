"use client";

import { useTransition } from "react";
import { CreditCard, MessageSquare } from "lucide-react";
import { sendTextToCustomer, type SmsResult } from "@/app/actions/sms";
import { formatCurrency, formatCurrencyDetailed } from "@/lib/format";
import { describeDays } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { ReputationMeter } from "./ReputationMeter";
import { smsErrorMessage } from "./smsErrors";

function handlePay(customer: Customer) {
  console.log(
    `[mock] Open Stripe checkout for ${customer.name} — ${formatCurrencyDetailed(customer.amountOwed)}`,
  );
  window.open("#", "_blank", "noopener,noreferrer");
}

function announce(result: SmsResult, customer: Customer) {
  if (result.ok) {
    alert(`Sent to ${customer.phone || customer.name}.`);
  } else {
    alert(smsErrorMessage(result.error));
  }
}

export function CustomerRow({ customer }: { customer: Customer }) {
  const [pending, start] = useTransition();
  const isOverdue = customer.daysLate > 0;

  function onText() {
    start(async () => {
      const result = await sendTextToCustomer(customer.id);
      announce(result, customer);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-center md:gap-4 md:px-6">
      <div className="flex flex-col gap-1.5">
        <div className="font-medium text-slate-900">{customer.name}</div>
        <ReputationMeter score={customer.reputationScore} />
      </div>

      <div className="flex flex-col">
        <span className="text-xs text-slate-500 md:hidden">Amount owed</span>
        <span className="text-lg font-semibold tabular-nums text-slate-900">
          {formatCurrency(customer.amountOwed)}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-xs text-slate-500 md:hidden">Status</span>
        <span
          className={`text-sm font-medium tabular-nums ${
            isOverdue ? "text-red-600" : "text-slate-600"
          }`}
        >
          {describeDays(customer.daysLate)}
        </span>
      </div>

      <div className="flex gap-2 md:justify-end">
        <button
          type="button"
          onClick={() => handlePay(customer)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 md:flex-initial"
        >
          <CreditCard className="h-4 w-4" aria-hidden />
          Pay Now
        </button>
        <button
          type="button"
          onClick={onText}
          disabled={pending || !customer.phone}
          title={!customer.phone ? "No phone on file" : undefined}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 md:flex-initial"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
          {pending ? "Sending…" : "Text"}
        </button>
      </div>
    </div>
  );
}
