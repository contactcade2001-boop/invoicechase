"use client";

import { Send } from "lucide-react";
import type { Customer } from "@/lib/types";

export function BulkTextButton({ overdue }: { overdue: Customer[] }) {
  const count = overdue.length;
  const disabled = count === 0;

  function handleClick() {
    if (disabled) return;
    const ok = window.confirm(
      `Text ${count} overdue customer${count === 1 ? "" : "s"} now?\n\nEach will receive an SMS with their amount owed and a payment link.`,
    );
    if (!ok) return;
    console.log(
      `[mock] Bulk SMS to ${count} customers:`,
      overdue.map((c) => `${c.name} (${c.phone})`),
    );
    alert(
      `Would text ${count} overdue customer${count === 1 ? "" : "s"} now.`,
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:w-auto"
    >
      <Send className="h-5 w-5" aria-hidden />
      {disabled
        ? "No overdue customers"
        : `Text ALL ${count} overdue customer${count === 1 ? "" : "s"} NOW`}
    </button>
  );
}
