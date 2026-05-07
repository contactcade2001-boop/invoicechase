"use client";

import { useTransition } from "react";
import { CreditCard, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getPayLinkUrl } from "@/app/actions/pay";
import {
  sendEmailReminderToCustomer,
  sendTextToCustomer,
  type SmsResult,
} from "@/app/actions/sms";
import { describeDays, formatCurrency } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { ReputationMeter } from "./ReputationMeter";
import { payErrorMessage, smsErrorMessage } from "./smsErrors";

function announceSms(result: SmsResult, customer: Customer) {
  if (result.ok) {
    alert(`Sent to ${customer.phone || customer.name}.`);
  } else {
    alert(smsErrorMessage(result.error));
  }
}

export function CustomerRow({ customer }: { customer: Customer }) {
  const [textPending, startText] = useTransition();
  const [payPending, startPay] = useTransition();
  const [emailPending, startEmail] = useTransition();
  const isOverdue = customer.daysLate > 0;

  function onText() {
    startText(async () => {
      const result = await sendTextToCustomer(customer.id);
      announceSms(result, customer);
    });
  }

  function onPay() {
    startPay(async () => {
      const result = await getPayLinkUrl(customer.id);
      if (result.ok) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        alert(payErrorMessage(result.error));
      }
    });
  }

  function onEmail() {
    startEmail(async () => {
      const result = await sendEmailReminderToCustomer(customer.id);
      if (result.ok) {
        alert(`Emailed ${customer.email}.`);
      } else {
        alert(smsErrorMessage(result.error));
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,2.2fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(280px,auto)] md:items-center md:gap-4 md:px-6">
      <div className="flex flex-col gap-1.5 md:min-w-0">
        <Link
          href={`/dashboard/customer/${customer.id}`}
          className="truncate font-medium text-slate-900 underline-offset-2 hover:underline"
        >
          {customer.name}
        </Link>
        <ReputationMeter score={customer.reputationScore} />
      </div>

      <div className="flex flex-col md:items-end">
        <span className="text-xs text-slate-500 md:hidden">Amount owed</span>
        <span className="text-lg font-semibold tabular-nums text-slate-900">
          {formatCurrency(customer.amountOwed)}
        </span>
      </div>

      <div className="flex flex-col md:items-end">
        <span className="text-xs text-slate-500 md:hidden">Status</span>
        <span
          className={`text-sm font-medium tabular-nums ${
            isOverdue ? "text-red-600" : "text-slate-600"
          }`}
        >
          {describeDays(customer.daysLate)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 md:flex md:justify-end">
        <button
          type="button"
          onClick={onPay}
          disabled={payPending}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 md:w-24"
        >
          <CreditCard className="h-4 w-4" aria-hidden />
          {payPending ? "…" : "Pay"}
        </button>
        <button
          type="button"
          onClick={onText}
          disabled={textPending || !customer.phone}
          title={!customer.phone ? "No phone on file" : undefined}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 md:w-24"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
          {textPending ? "…" : "Text"}
        </button>
        <button
          type="button"
          onClick={onEmail}
          disabled={emailPending || !customer.email}
          title={!customer.email ? "No email on file" : undefined}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 md:w-24"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {emailPending ? "…" : "Email"}
        </button>
      </div>
    </div>
  );
}
