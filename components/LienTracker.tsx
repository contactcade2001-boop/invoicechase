"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertOctagon,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Plus,
  Scale,
} from "lucide-react";

type Lien = {
  id: number;
  customerName: string | null;
  jobAddress: string | null;
  state: string;
  invoiceAmountCents: number;
  filingDeadline: number;
  lastFurnishDate: number;
};

type Props = {
  initialLiens: Lien[];
  stateCodes: string[];
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function daysLeft(deadlineMs: number): number {
  return Math.floor((deadlineMs - Date.now()) / 86_400_000);
}

function urgencyClass(deadlineMs: number) {
  const d = daysLeft(deadlineMs);
  if (d < 0) return "border-red-300 bg-red-50 text-red-700";
  if (d <= 14) return "border-orange-300 bg-orange-50 text-orange-700";
  if (d <= 45) return "border-amber-300 bg-amber-50 text-amber-700";
  return "border-stone-800 bg-stone-900/70 text-stone-300";
}

export function LienTracker({ initialLiens, stateCodes }: Props) {
  const router = useRouter();
  const [liens, setLiens] = useState(initialLiens);
  const [showForm, setShowForm] = useState(initialLiens.length === 0);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // form
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [jobAddress, setJobAddress] = useState("");
  const [state, setState] = useState("TX");
  const [amount, setAmount] = useState(0);
  const [lastFurnish, setLastFurnish] = useState(
    new Date().toISOString().slice(0, 10),
  );

  function add() {
    setErr(null);
    if (!customerName || amount <= 0) {
      setErr("Customer name and invoice amount are required.");
      return;
    }
    start(async () => {
      const res = await fetch("/api/liens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || customerName.toLowerCase().replace(/\s+/g, "-"),
          customerName,
          jobAddress,
          state,
          invoiceAmountDollars: amount,
          lastFurnishDateIso: lastFurnish,
        }),
      });
      if (!res.ok) {
        setErr("Could not create lien — check fields.");
        return;
      }
      const { lien } = (await res.json()) as { lien: Lien };
      setLiens([
        ...liens,
        {
          id: lien.id,
          customerName,
          jobAddress,
          state,
          invoiceAmountCents: Math.round(amount * 100),
          filingDeadline: lien.filingDeadline,
          lastFurnishDate: lien.lastFurnishDate,
        },
      ]);
      setCustomerName("");
      setCustomerId("");
      setJobAddress("");
      setAmount(0);
      setShowForm(false);
      router.refresh();
    });
  }

  function resolve(id: number, status: "filed" | "paid" | "ignored") {
    start(async () => {
      await fetch("/api/liens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setLiens(liens.filter((l) => l.id !== id));
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <Scale className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">
              Mechanics liens are legal claims on real property.
            </p>
            <p className="mt-1 leading-6">
              Many states also require a <strong>preliminary notice</strong>{" "}
              within 20 days of starting work, and most require strict
              documentation. This tool tracks the filing deadline — consult a
              construction attorney before filing.
            </p>
          </div>
        </div>
      </div>

      {liens.length > 0 ? (
        <div className="overflow-hidden rounded-2xl bg-stone-900/70 shadow-sm ring-1 ring-stone-800">
          <div className="border-b border-stone-800 bg-stone-900/40 px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Tracking {liens.length} job
              {liens.length === 1 ? "" : "s"}
            </p>
          </div>
          {liens.map((l) => {
            const d = daysLeft(l.filingDeadline);
            const cls = urgencyClass(l.filingDeadline);
            const Icon = d < 0 ? AlertOctagon : d <= 14 ? AlertTriangle : Calendar;
            return (
              <div
                key={l.id}
                className={`flex flex-wrap items-center gap-4 border-b border-stone-800/60 px-5 py-4 last:border-b-0 ${
                  d <= 14 ? "bg-orange-50/30" : ""
                }`}
              >
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${cls}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-100">
                    {l.customerName}{" "}
                    <span className="text-xs font-normal text-stone-500">
                      · {l.state}
                    </span>
                  </p>
                  {l.jobAddress ? (
                    <p className="text-xs text-stone-500">{l.jobAddress}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-stone-500">
                    Last furnish: {new Date(l.lastFurnishDate).toLocaleDateString()} ·
                    Deadline: {new Date(l.filingDeadline).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold tabular-nums text-stone-100">
                    {formatCurrency(l.invoiceAmountCents)}
                  </p>
                  <p
                    className={`text-xs font-semibold ${
                      d < 0
                        ? "text-red-700"
                        : d <= 14
                          ? "text-orange-700"
                          : d <= 45
                            ? "text-amber-700"
                            : "text-stone-500"
                    }`}
                  >
                    {d < 0
                      ? `${Math.abs(d)}d past`
                      : d === 0
                        ? "today"
                        : `${d}d left`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => resolve(l.id, "paid")}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => resolve(l.id, "filed")}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-md bg-orange-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
                  >
                    Filed
                  </button>
                  <button
                    type="button"
                    onClick={() => resolve(l.id, "ignored")}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-stone-500 transition hover:bg-orange-700 hover:text-stone-100 disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {showForm ? (
        <div className="rounded-2xl bg-stone-900/70 p-6 shadow-sm ring-1 ring-stone-800">
          <p className="font-display text-base font-semibold text-stone-100">
            Track a new job
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Customer name">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Acme Construction"
                className="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
              />
            </Field>
            <Field label="QuickBooks customer ID (optional)">
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="auto-generated if blank"
                className="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
              />
            </Field>
            <Field label="Job address" className="sm:col-span-2">
              <input
                type="text"
                value={jobAddress}
                onChange={(e) => setJobAddress(e.target.value)}
                placeholder="123 Main St, Austin TX 78701"
                className="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
              />
            </Field>
            <Field label="State">
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="block w-full rounded-md border-0 bg-stone-900/70 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
              >
                {stateCodes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Invoice amount (USD)">
              <input
                type="number"
                value={amount}
                step={100}
                min={0}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
              />
            </Field>
            <Field label="Last day of work / materials">
              <input
                type="date"
                value={lastFurnish}
                onChange={(e) => setLastFurnish(e.target.value)}
                className="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
              />
            </Field>
          </div>
          {err ? (
            <p className="mt-2 text-xs text-red-700">{err}</p>
          ) : null}
          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={add}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Track this job
            </button>
            {liens.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-medium text-stone-500 hover:text-stone-100"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Track another job
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
