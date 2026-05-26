"use client";

import { useState, useTransition } from "react";
import { saveCashflowConfig } from "@/app/actions/org";

export function CashflowSettingsForm({
  initial,
}: {
  initial: { monthlyOutflowDollars: number; monthlyNewInvoicesDollars: number };
}) {
  const [outflow, setOutflow] = useState(initial.monthlyOutflowDollars);
  const [newRev, setNewRev] = useState(initial.monthlyNewInvoicesDollars);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSave() {
    setError(null);
    setSaved(false);
    start(async () => {
      const r = await saveCashflowConfig({
        monthlyOutflowDollars: outflow,
        monthlyNewInvoicesDollars: newRev,
      });
      if (r.ok) {
        setSaved(true);
      } else {
        setError(
          r.error === "invalid_amount"
            ? "Amounts must be valid numbers."
            : r.error === "forbidden"
              ? "Only the owner can save this."
              : "Couldn't save. Try again.",
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Recurring monthly outflows ($)
          </span>
          <span className="block text-xs text-slate-500">
            Payroll, rent, software, supplies — everything that goes out
            each month.
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={outflow}
            onChange={(e) => setOutflow(Number(e.target.value))}
            className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Expected new revenue ($/month)
          </span>
          <span className="block text-xs text-slate-500">
            Average new invoices you&apos;ll issue each month going forward.
            Leave at 0 if you only want to forecast existing AR.
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={newRev}
            onChange={(e) => setNewRev(Number(e.target.value))}
            className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
        </label>
      </div>
      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending ? "Saving…" : "Save assumptions"}
        </button>
        {saved ? (
          <span className="text-sm text-emerald-700">Saved</span>
        ) : null}
      </div>
    </div>
  );
}
