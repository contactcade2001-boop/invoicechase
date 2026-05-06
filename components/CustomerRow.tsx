"use client";

import { CreditCard, MessageSquare } from "lucide-react";
import type { Customer } from "@/lib/types";
import {
  describeDays,
  formatCurrency,
  formatCurrencyDetailed,
} from "@/lib/format";
import { RiskBadge } from "./RiskBadge";

function handlePay(customer: Customer) {
  console.log(
    `[mock] Open Stripe checkout for ${customer.name} — ${formatCurrencyDetailed(customer.amountOwed)}`,
  );
  window.open("#", "_blank", "noopener,noreferrer");
}

function handleText(customer: Customer) {
  const message = `Pay ${formatCurrencyDetailed(customer.amountOwed)} now [Stripe link]`;
  console.log(`[mock] SMS ${customer.phone}: ${message}`);
  alert(`Would SMS ${customer.phone}:\n\n${message}`);
}

export function CustomerRow({ customer }: { customer: Customer }) {
  const isOverdue = customer.daysLate > 0;
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-center md:gap-4 md:px-6">
      <div className="flex flex-col gap-1">
        <div className="font-medium text-slate-900">{customer.name}</div>
        <div className="md:hidden">
          <RiskBadge tier={customer.riskTier} />
        </div>
        <div className="hidden md:block">
          <RiskBadge tier={customer.riskTier} />
        </div>
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
          onClick={() => handleText(customer)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 md:flex-initial"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
          Text
        </button>
      </div>
    </div>
  );
}
