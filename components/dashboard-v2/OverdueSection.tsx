import Link from "next/link";
import type { OverdueInvoice } from "@/lib/dashboard/types";
import { EmptyOverdue } from "./EmptyOverdue";
import { OverdueRow } from "./OverdueRow";

function fmtUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function OverdueSection({
  overdue,
}: {
  overdue: OverdueInvoice[];
}) {
  if (overdue.length === 0) {
    return (
      <section
        aria-label="Overdue invoices"
        className="rounded-mk-xl bg-mk-surface p-6 shadow-mk-1 ring-1 ring-mk-ink-300/60"
      >
        <SectionHeader title="Overdue" count={0} />
        <EmptyOverdue />
      </section>
    );
  }

  const totalCents = overdue.reduce((s, o) => s + o.amountCents, 0);

  return (
    <section
      aria-label="Overdue invoices"
      className="overflow-hidden rounded-mk-xl bg-mk-surface shadow-mk-1 ring-1 ring-mk-ink-300/60"
    >
      <div className="border-b border-mk-ink-300/60 p-6">
        <SectionHeader title="Overdue" count={overdue.length} />
        <p className="mt-1 text-[13px] text-mk-ink-500">
          {fmtUsd(totalCents)} outstanding · sorted by amount
        </p>
      </div>
      <ul className="divide-y divide-mk-ink-300/60">
        {overdue.map((o) => (
          <OverdueRow key={o.customerId} item={o} />
        ))}
      </ul>
      <div className="border-t border-mk-ink-300/60 px-6 py-3 text-center">
        <Link
          href="/customers"
          className="text-[12px] font-semibold text-mk-primary-600 hover:text-mk-primary-700"
        >
          View all customers →
        </Link>
      </div>
    </section>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="mk-display text-[18px] font-semibold text-mk-ink-950">
        {title}
        {count > 0 ? (
          <span className="ml-2 text-[13px] font-medium text-mk-ink-500">
            {count}
          </span>
        ) : null}
      </h2>
    </div>
  );
}
