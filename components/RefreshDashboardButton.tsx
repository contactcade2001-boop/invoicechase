"use client";

import { useEffect, useState, useTransition } from "react";
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { refreshDashboard } from "@/app/actions/qbo";

const messages: Record<string, string> = {
  rate_limited: "Just refreshed — try again in a minute.",
  not_connected: "QuickBooks isn't connected.",
  refresh_failed: "QuickBooks is slow right now. Try again in a minute.",
  not_signed_in: "Please sign in again.",
  no_organization: "Account not yet set up.",
};

function formatRefreshed(ms: number | null): string {
  if (!ms) return "Never refreshed";
  const ageSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (ageSec < 5) return "Just now";
  if (ageSec < 60) return `${ageSec}s ago`;
  const min = Math.floor(ageSec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return new Date(ms).toLocaleString();
}

export function RefreshDashboardButton({
  refreshedAt,
  stale,
}: {
  refreshedAt: number | null;
  stale: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Re-render every 20s so "X min ago" stays accurate without polling QBO.
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 20_000);
    return () => clearInterval(t);
  }, []);

  function handleClick() {
    setError(null);
    start(async () => {
      const r = await refreshDashboard();
      if (!r.ok) {
        setError(messages[r.error] ?? "Couldn't refresh. Try again shortly.");
        return;
      }
      router.refresh();
    });
  }

  // Read tick to ensure interval triggers re-renders.
  void tick;

  return (
    <div className="flex items-center gap-3 text-xs text-stone-500">
      {stale ? (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
          Showing cached data
        </span>
      ) : null}
      <span>Last synced {formatRefreshed(refreshedAt)}</span>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-stone-300 ring-1 ring-inset ring-stone-700 transition hover:bg-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Refresh dashboard"
      >
        <RefreshCcw
          className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`}
          aria-hidden
        />
        {pending ? "Refreshing…" : "Refresh"}
      </button>
      {error ? <span className="text-red-600">{error}</span> : null}
    </div>
  );
}
