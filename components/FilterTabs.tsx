"use client";

import type { FilterKey } from "@/lib/types";

type TabConfig = { key: FilterKey; label: string };

const tabs: TabConfig[] = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "high-risk", label: "High Risk" },
  { key: "low-risk", label: "Low Risk" },
];

type Props = {
  active: FilterKey;
  counts: Record<FilterKey, number>;
  onChange: (key: FilterKey) => void;
};

export function FilterTabs({ active, counts, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Filter customers"
      className="flex flex-wrap gap-2"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              isActive
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
            <span
              className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
