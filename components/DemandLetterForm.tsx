"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function DemandLetterForm() {
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState(0);
  const [daysLate, setDaysLate] = useState(0);
  const [work, setWork] = useState("");
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    const res = await fetch("/api/demand-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerAddress,
        invoiceNumber,
        amountDollars: amount,
        daysLate,
        workDescription: work,
      }),
    });
    if (!res.ok) {
      setBusy(false);
      alert("Could not generate letter.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demand-letter-${customerName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Customer name">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Acme Construction LLC"
            className="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </Field>
        <Field label="Customer address">
          <input
            type="text"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="123 Main St, Austin TX 78701"
            className="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </Field>
        <Field label="Invoice number">
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="INV-4218"
            className="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </Field>
        <Field label="Amount owed (USD)">
          <input
            type="number"
            value={amount}
            min={0}
            step={100}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </Field>
        <Field label="Days past due">
          <input
            type="number"
            value={daysLate}
            min={0}
            step={1}
            onChange={(e) => setDaysLate(parseInt(e.target.value) || 0)}
            className="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </Field>
        <Field label="Work description (short)" className="sm:col-span-2">
          <input
            type="text"
            value={work}
            onChange={(e) => setWork(e.target.value)}
            placeholder="full HVAC replacement at 123 Main St"
            className="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </Field>
      </div>
      <button
        type="button"
        onClick={download}
        disabled={busy || !customerName || amount <= 0}
        className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        {busy ? "Generating…" : "Download demand letter"}
      </button>
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
