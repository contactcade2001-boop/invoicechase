"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { Period } from "@/lib/dashboard/types";

const OPTIONS: { value: Period; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
];

/**
 * Tiny pill segmented control. Syncs to ?period= so SSR can read it,
 * which keeps the whole page server-rendered and bookmarkable.
 */
export function PeriodToggle({ current }: { current: Period }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function set(next: Period) {
    if (next === current) return;
    const sp = new URLSearchParams(params.toString());
    sp.set("period", next);
    start(() => router.push(`${pathname}?${sp.toString()}`, { scroll: false }));
  }

  return (
    <div
      role="tablist"
      aria-label="Select period"
      className="inline-flex rounded-mk-full bg-mk-ink-100 p-0.5"
    >
      {OPTIONS.map((o) => {
        const active = o.value === current;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => set(o.value)}
            disabled={pending}
            className={`rounded-mk-full px-3 py-1 text-[12px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-mk-focus ${
              active
                ? "bg-mk-surface text-mk-ink-950 shadow-mk-1"
                : "text-mk-ink-500 hover:text-mk-ink-950"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
