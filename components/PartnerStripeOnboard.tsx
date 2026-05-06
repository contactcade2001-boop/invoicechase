"use client";

import { useState, useTransition } from "react";
import { startPartnerStripeOnboarding } from "@/app/actions/partner";

export function PartnerStripeOnboard({ connected }: { connected: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    start(async () => {
      const r = await startPartnerStripeOnboarding();
      if (!r.ok) {
        setError(
          r.error === "stripe_failed"
            ? "Stripe rejected the request. Please try again."
            : "Couldn't start onboarding.",
        );
        return;
      }
      window.location.href = r.url;
    });
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending
          ? "Loading…"
          : connected
            ? "Update Stripe details"
            : "Set up Stripe payouts"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
