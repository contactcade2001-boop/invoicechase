"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

const SOURCES = ["", "stripe", "twilio"] as const;
const STATUSES = ["", "received", "processed", "ignored", "rejected", "errored"] as const;
const SINCE_PRESETS: Array<{ value: string; label: string }> = [
  { value: "", label: "All time" },
  { value: "1h", label: "Last hour" },
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 days" },
];

export type WebhookFilterState = {
  source: string;
  status: string;
  type: string;
  since: string;
};

export function WebhookEventControls({
  initial,
  exportHref,
}: {
  initial: WebhookFilterState;
  exportHref: string;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<WebhookFilterState>(initial);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => router.refresh(), 10_000);
    return () => clearInterval(id);
  }, [autoRefresh, router]);

  function apply(next: Partial<WebhookFilterState>) {
    const merged = { ...filters, ...next };
    setFilters(merged);
    const qs = new URLSearchParams();
    if (merged.source) qs.set("source", merged.source);
    if (merged.status) qs.set("status", merged.status);
    if (merged.type.trim()) qs.set("type", merged.type.trim());
    if (merged.since) qs.set("since", merged.since);
    const search = qs.toString();
    router.push(`/webhook-events${search ? `?${search}` : ""}`);
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Source
          <select
            value={filters.source}
            onChange={(e) => apply({ source: e.target.value })}
            className="rounded-md border-0 px-2 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          >
            {SOURCES.map((s) => (
              <option key={s || "any"} value={s}>
                {s || "Any"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Status
          <select
            value={filters.status}
            onChange={(e) => apply({ status: e.target.value })}
            className="rounded-md border-0 px-2 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          >
            {STATUSES.map((s) => (
              <option key={s || "any"} value={s}>
                {s || "Any"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Time
          <select
            value={filters.since}
            onChange={(e) => apply({ since: e.target.value })}
            className="rounded-md border-0 px-2 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          >
            {SINCE_PRESETS.map((p) => (
              <option key={p.value || "all"} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
          Type contains
          <input
            type="search"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply({ type: filters.type });
            }}
            placeholder="checkout.session"
            className="rounded-md border-0 px-2 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <RefreshCw className="h-3 w-3" aria-hidden /> Refresh
          </button>
          <a
            href={exportHref}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
          >
            <Download className="h-3 w-3" aria-hidden /> CSV
          </a>
          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
            Live (10s)
          </label>
        </div>
      </div>
    </div>
  );
}
