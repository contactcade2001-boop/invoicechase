"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { bulkEmailOverdue } from "@/app/actions/sms";
import type { Customer } from "@/lib/types";
import { smsErrorMessage } from "./smsErrors";

export function BulkEmailButton({ overdue }: { overdue: Customer[] }) {
  const [pending, start] = useTransition();
  const withEmail = overdue.filter((c) => c.email).length;
  const disabled = withEmail === 0 || pending;

  function handleClick() {
    if (withEmail === 0) return;
    const ok = window.confirm(
      `Email ${withEmail} overdue customer${withEmail === 1 ? "" : "s"}?\n\nEach gets your branded reminder with a payment link.`,
    );
    if (!ok) return;
    start(async () => {
      const result = await bulkEmailOverdue();
      if (!result.ok) {
        alert(smsErrorMessage(result.error));
        return;
      }
      const noun = result.sentCount === 1 ? "customer" : "customers";
      const skippedNote =
        result.skippedCount > 0
          ? ` Skipped ${result.skippedCount} with no email.`
          : "";
      const failedNote =
        result.failedCount > 0
          ? ` (${result.failedCount} failed — see logs)`
          : "";
      alert(`Emailed ${result.sentCount} ${noun}.${skippedNote}${failedNote}`);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={withEmail === 0 ? "No overdue customers with emails on file" : undefined}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-900/70 px-4 py-2 text-sm font-semibold text-stone-300 shadow-sm ring-1 ring-inset ring-stone-700 transition hover:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Sparkles className="h-4 w-4" aria-hidden />
      {pending
        ? "Emailing…"
        : `Email with AI${withEmail > 0 ? ` (${withEmail})` : ""}`}
    </button>
  );
}
