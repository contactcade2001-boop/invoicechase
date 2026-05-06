"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { retryQboSync } from "@/app/actions/qbo";

export function RetrySyncButton({ paymentId }: { paymentId: number }) {
  const [pending, start] = useTransition();

  function onClick() {
    start(async () => {
      const result = await retryQboSync(paymentId);
      if (!result.ok) {
        alert(`Sync failed: ${result.error}`);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title="Retry pushing this payment to QuickBooks"
      className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100 disabled:opacity-60"
    >
      <RefreshCw
        className={`h-3 w-3 ${pending ? "animate-spin" : ""}`}
        aria-hidden
      />
      {pending ? "Syncing…" : "Sync to QBO"}
    </button>
  );
}
