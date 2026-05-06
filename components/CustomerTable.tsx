import { Inbox } from "lucide-react";
import type { Customer } from "@/lib/types";
import { CustomerRow } from "./CustomerRow";

export function CustomerTable({ customers }: { customers: Customer[] }) {
  if (customers.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
        <Inbox className="mx-auto h-8 w-8 text-slate-400" aria-hidden />
        <h3 className="mt-3 text-sm font-semibold text-slate-900">
          No customers match this filter
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Try a different filter to see more.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="hidden grid-cols-[1.6fr_1fr_1fr_auto] items-center gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
        <div>Customer</div>
        <div>Amount owed</div>
        <div>Status</div>
        <div className="text-right">Actions</div>
      </div>
      <div>
        {customers.map((customer) => (
          <CustomerRow key={customer.id} customer={customer} />
        ))}
      </div>
    </div>
  );
}
