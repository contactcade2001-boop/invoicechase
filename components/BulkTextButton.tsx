"use client";

import { useTransition } from "react";
import { Send } from "lucide-react";
import { bulkTextOverdue } from "@/app/actions/sms";
import type { Customer } from "@/lib/types";
import { smsErrorMessage } from "./smsErrors";

export function BulkTextButton({ overdue }: { overdue: Customer[] }) {
  const [pending, start] = useTransition();
  const count = overdue.length;
  const disabled = count === 0 || pending;

  function handleClick() {
    if (count === 0) return;
    const ok = window.confirm(
      `Text ${count} overdue customer${count === 1 ? "" : "s"} now?\n\nEach will receive an SMS with their amount owed and a payment link.`,
    );
    if (!ok) return;
    start(async () => {
      const result = await bulkTextOverdue();
      if (!result.ok) {
        alert(smsErrorMessage(result.error));
        return;
      }
      const noun = result.sentCount === 1 ? "customer" : "customers";
      const skippedNote =
        (result.skippedCount ?? 0) > 0
          ? ` Skipped ${result.skippedCount} who replied STOP.`
          : "";
      const failedNote =
        result.failedCount > 0
          ? ` (${result.failedCount} failed — see logs)`
          : "";
      alert(`Texted ${result.sentCount} ${noun}.${skippedNote}${failedNote}`);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:w-auto"
    >
      <Send className="h-5 w-5" aria-hidden />
      {pending
        ? `Texting ${count}…`
        : count === 0
          ? "No overdue customers"
          : `Text ALL ${count} overdue customer${count === 1 ? "" : "s"} NOW`}
    </button>
  );
}
