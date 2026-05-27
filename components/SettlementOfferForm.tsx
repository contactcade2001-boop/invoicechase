"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, XCircle } from "lucide-react";

type OpenOffer = {
  id: number;
  customerName: string | null;
  originalBalanceCents: number;
  offerBalanceCents: number;
  status: string;
  expiresAt: number;
};

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function SettlementOfferForm({
  openOffers,
}: {
  openOffers: OpenOffer[];
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [balance, setBalance] = useState(0);
  const [discount, setDiscount] = useState(15);
  const [expHours, setExpHours] = useState(48);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const offerAmount = balance * (1 - discount / 100);

  function submit() {
    if (!customerName || balance <= 0) {
      setErr("Customer name + balance required.");
      return;
    }
    setErr(null);
    start(async () => {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || customerName.toLowerCase().replace(/\s+/g, "-"),
          customerName,
          originalBalanceDollars: balance,
          discountPercent: discount,
          expiresInHours: expHours,
        }),
      });
      if (!res.ok) {
        setErr("Could not create offer.");
        return;
      }
      setCustomerId("");
      setCustomerName("");
      setBalance(0);
      router.refresh();
    });
  }

  function update(id: number, status: "accepted" | "declined" | "paid") {
    start(async () => {
      await fetch("/api/settlements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Customer name
          </span>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Westshore Hotel Group"
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            QBO ID (optional)
          </span>
          <input
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="auto"
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Outstanding balance (USD)
          </span>
          <input
            type="number"
            value={balance}
            min={0}
            step={100}
            onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Discount %
          </span>
          <input
            type="number"
            value={discount}
            min={1}
            max={80}
            step={5}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Expires in (hours)
          </span>
          <input
            type="number"
            value={expHours}
            min={4}
            max={336}
            step={4}
            onChange={(e) => setExpHours(parseFloat(e.target.value) || 48)}
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </label>
      </div>
      {balance > 0 ? (
        <div className="rounded-md bg-emerald-50 px-4 py-3 ring-1 ring-inset ring-emerald-200">
          <p className="text-xs text-emerald-700">
            Customer pays{" "}
            <strong className="text-stone-900">${offerAmount.toFixed(2)}</strong>, you
            forgive{" "}
            <strong>${(balance - offerAmount).toFixed(2)}</strong>. Better than
            $0 if they were going to write you off.
          </p>
        </div>
      ) : null}
      {err ? <p className="text-xs text-red-700">{err}</p> : null}
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
        Create offer
      </button>

      {openOffers.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-stone-200">
          <p className="border-b border-stone-200 bg-stone-50/60 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Open offers
          </p>
          {openOffers.map((o) => {
            const hours = Math.max(0, Math.floor((o.expiresAt - Date.now()) / 3_600_000));
            const expired = o.expiresAt < Date.now();
            return (
              <div
                key={o.id}
                className="flex flex-wrap items-center gap-3 border-b border-stone-100 px-5 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-900">
                    {o.customerName ?? "Customer"}{" "}
                    <span className="text-xs font-normal text-stone-500">
                      · {o.status}
                    </span>
                  </p>
                  <p className="text-xs text-stone-500">
                    {fmt(o.offerBalanceCents)} of {fmt(o.originalBalanceCents)}{" "}
                    · {expired ? "expired" : `${hours}h left`}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => update(o.id, "paid")}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => update(o.id, "declined")}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                  >
                    <XCircle className="h-3 w-3" />
                    Declined
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
