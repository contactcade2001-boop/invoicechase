"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPaymentPlanForCustomer } from "@/app/actions/paymentPlans";
import type { Customer } from "@/lib/types";

const errorMessages: Record<string, string> = {
  not_signed_in: "Please sign in again.",
  forbidden: "You don't have permission for this action.",
  no_active_subscription: "Activate your subscription first.",
  not_connected: "Connect QuickBooks first.",
  customer_not_found: "Customer not found.",
  invalid_total: "Total must be greater than zero.",
  invalid_count: "Choose between 2 and 24 installments.",
  invalid_frequency: "Frequency must be 7–90 days.",
  invalid_start_date: "Pick a valid first-installment date.",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NewPaymentPlanModal({
  open,
  onClose,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  customer: Customer;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [totalCents, setTotalCents] = useState<number>(customer.amountOwed);
  const [count, setCount] = useState<number>(3);
  const [frequency, setFrequency] = useState<number>(14);
  const [startDate, setStartDate] = useState<string>(todayIso());
  const [note, setNote] = useState<string>("");

  if (!open) return null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await createPaymentPlanForCustomer({
        customerId: customer.id,
        totalCents,
        installmentCount: count,
        frequencyDays: frequency,
        startDate,
        note,
      });
      if (!r.ok) {
        setError(errorMessages[r.error] ?? "Couldn't create plan.");
        return;
      }
      router.push("/payment-plans");
    });
  }

  const installmentCents = Math.floor(totalCents / Math.max(count, 1));

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold tracking-tight">
          New payment plan for {customer.name}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Splits this balance into a sequence of equal pay-link installments.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Total ($)
            </span>
            <input
              type="number"
              min={1}
              step={0.01}
              value={(totalCents / 100).toFixed(2)}
              onChange={(e) =>
                setTotalCents(Math.round(Number(e.target.value) * 100))
              }
              className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Installments
            </span>
            <input
              type="number"
              min={2}
              max={24}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Every (days)
            </span>
            <input
              type="number"
              min={7}
              max={90}
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              First due
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Note (optional)
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="e.g. Roof repair invoice 4112"
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
        </label>

        <p className="mt-4 text-xs text-stone-500">
          Each installment ≈ ${(installmentCents / 100).toFixed(2)}, due every{" "}
          {frequency} days starting {startDate}.
        </p>

        {error ? (
          <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {pending ? "Creating…" : "Create plan"}
          </button>
        </div>
      </form>
    </div>
  );
}
