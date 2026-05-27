"use client";

import { useMemo, useState, useTransition } from "react";
import { Inbox, Mail, MessageSquare, Tag, X } from "lucide-react";
import {
  sendEmailReminderToCustomer,
  sendTextToCustomer,
} from "@/app/actions/sms";
import type { Customer } from "@/lib/types";
import { CustomerRow } from "./CustomerRow";

export function CustomerTable({ customers }: { customers: Customer[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const visibleIds = useMemo(() => customers.map((c) => c.id), [customers]);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function bulkText() {
    const targets = customers.filter(
      (c) => selected.has(c.id) && c.phone && c.daysLate > 0,
    );
    if (targets.length === 0) {
      flash("No selected customers have a phone + overdue balance.");
      return;
    }
    if (
      !confirm(
        `Text ${targets.length} customer${targets.length === 1 ? "" : "s"} a personalized reminder?`,
      )
    )
      return;
    startTransition(async () => {
      let ok = 0;
      for (const c of targets) {
        const r = await sendTextToCustomer(c.id);
        if (r.ok) ok++;
      }
      flash(`Texted ${ok}/${targets.length} customers.`);
      setSelected(new Set());
    });
  }

  function bulkEmail() {
    const targets = customers.filter(
      (c) => selected.has(c.id) && c.email && c.daysLate > 0,
    );
    if (targets.length === 0) {
      flash("No selected customers have an email + overdue balance.");
      return;
    }
    if (
      !confirm(
        `Email ${targets.length} customer${targets.length === 1 ? "" : "s"} a branded reminder?`,
      )
    )
      return;
    startTransition(async () => {
      let ok = 0;
      for (const c of targets) {
        const r = await sendEmailReminderToCustomer(c.id);
        if (r.ok) ok++;
      }
      flash(`Emailed ${ok}/${targets.length} customers.`);
      setSelected(new Set());
    });
  }

  async function bulkTag() {
    const tag = window.prompt("Tag selected customers with…", "VIP");
    if (!tag || tag.trim().length === 0) return;
    const ids = customers.filter((c) => selected.has(c.id)).map((c) => c.id);
    startTransition(async () => {
      let ok = 0;
      for (const customerId of ids) {
        const r = await fetch("/api/customer-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId, tags: [tag.trim()] }),
        });
        if (r.ok) ok++;
      }
      flash(`Tagged ${ok}/${ids.length} customers "${tag.trim()}".`);
      setSelected(new Set());
    });
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-stone-200">
        <Inbox className="mx-auto h-8 w-8 text-stone-400" aria-hidden />
        <h3 className="mt-3 text-sm font-semibold text-stone-900">
          No customers match this filter
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          Try a different filter to see more.
        </p>
      </div>
    );
  }

  const selCount = selected.size;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
      {selCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-3">
          <p className="text-sm font-semibold text-stone-900">
            {selCount} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={bulkText}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-50"
            >
              <MessageSquare className="h-3 w-3" />
              Text selected
            </button>
            <button
              type="button"
              onClick={bulkEmail}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm ring-1 ring-stone-300 transition hover:bg-stone-50 hover:ring-stone-400 disabled:opacity-50"
            >
              <Mail className="h-3 w-3" />
              Email selected
            </button>
            <button
              type="button"
              onClick={bulkTag}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm ring-1 ring-stone-300 transition hover:bg-stone-50 hover:ring-stone-400 disabled:opacity-50"
            >
              <Tag className="h-3 w-3" />
              Tag selected
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
              aria-label="Clear selection"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-medium text-emerald-800">
          {toast}
        </div>
      ) : null}

      <div className="hidden grid-cols-[28px_minmax(0,2.4fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(200px,auto)] items-center gap-4 border-b border-stone-200 bg-stone-50/60 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500 md:grid">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          aria-label="Select all"
          className="h-4 w-4 cursor-pointer rounded border-stone-300 text-orange-600 focus:ring-orange-500"
        />
        <div>Customer</div>
        <div className="text-right">Amount owed</div>
        <div className="text-right">Status</div>
        <div className="text-right">Actions</div>
      </div>

      <div>
        {customers.map((customer) => (
          <SelectableRow
            key={customer.id}
            customer={customer}
            checked={selected.has(customer.id)}
            onToggle={() => toggleOne(customer.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SelectableRow({
  customer,
  checked,
  onToggle,
}: {
  customer: Customer;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex border-b border-stone-100 last:border-b-0 ${
        checked ? "bg-orange-50/40" : ""
      }`}
    >
      <label className="hidden cursor-pointer items-center justify-center px-3 md:flex">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Select ${customer.name}`}
          className="h-4 w-4 cursor-pointer rounded border-stone-300 text-orange-600 focus:ring-orange-500"
        />
      </label>
      <div className="min-w-0 flex-1">
        <CustomerRow customer={customer} />
      </div>
    </div>
  );
}
