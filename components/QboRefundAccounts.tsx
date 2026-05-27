"use client";

import { useState, useTransition } from "react";
import { saveQboRefundAccounts } from "@/app/actions/org";

export type QboPickItem = { id: string; name: string };

export function QboRefundAccounts({
  accounts,
  items,
  initial,
  loadError,
}: {
  accounts: QboPickItem[];
  items: QboPickItem[];
  initial: { depositToAccountId: string; refundItemId: string };
  loadError: string | null;
}) {
  const [depositTo, setDepositTo] = useState(initial.depositToAccountId);
  const [refundItem, setRefundItem] = useState(initial.refundItemId);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function onSave() {
    start(async () => {
      const r = await saveQboRefundAccounts({
        depositToAccountId: depositTo,
        refundItemId: refundItem,
      });
      if (r.ok) setSavedAt(Date.now());
    });
  }

  if (loadError) {
    return (
      <p className="text-sm text-amber-700">
        Couldn&apos;t load your QuickBooks accounts: {loadError}. Reconnect
        QuickBooks from the dashboard if this persists.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-stone-300">
            Deposit-to account
          </span>
          <p className="text-xs text-stone-500">
            The Bank account where Stripe deposits land in your books.
          </p>
          <select
            value={depositTo}
            onChange={(e) => setDepositTo(e.target.value)}
            className="mt-1 w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          >
            <option value="">Select an account…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-300">
            Refund line item
          </span>
          <p className="text-xs text-stone-500">
            Item used on partial-refund line entries (e.g. Services or a
            dedicated Refund item).
          </p>
          <select
            value={refundItem}
            onChange={(e) => setRefundItem(e.target.value)}
            className="mt-1 w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          >
            <option value="">Select an item…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending ? "Saving…" : "Save accounts"}
        </button>
        {savedAt && Date.now() - savedAt < 4000 ? (
          <span className="text-sm text-emerald-700">Saved</span>
        ) : null}
      </div>
      <p className="text-xs text-stone-500">
        With both selected, partial Stripe refunds auto-post a RefundReceipt
        to QuickBooks. Without them, partial refunds are recorded in Invoice
        Chase only and need manual reconciliation.
      </p>
    </div>
  );
}
