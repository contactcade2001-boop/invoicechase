"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { bulkTextOverdue } from "@/app/actions/sms";
import type { Customer } from "@/lib/types";
import { smsErrorMessage } from "./smsErrors";

export function BulkTextButton({ overdue }: { overdue: Customer[] }) {
  const [pending, start] = useTransition();
  const count = overdue.filter((c) => c.phone).length;
  const disabled = count === 0 || pending;

  function handleClick() {
    if (count === 0) return;
    const ok = window.confirm(
      `Text ${count} overdue customer${count === 1 ? "" : "s"}?\n\nEach gets a personalized SMS with their amount owed and a payment link.`,
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
      title={count === 0 ? "No overdue customers with phone numbers" : undefined}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
    >
      <Sparkles className="h-4 w-4" aria-hidden />
      {pending
        ? "Texting…"
        : `Text with AI${count > 0 ? ` (${count})` : ""}`}
    </button>
  );
}
