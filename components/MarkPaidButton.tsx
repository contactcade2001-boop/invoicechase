"use client";

import { useState, useTransition } from "react";
import { markPartnerCommissionPaid } from "@/app/actions/partner";

export function MarkPaidButton({ commissionId }: { commissionId: number }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    const ref = window.prompt(
      "Enter the payout reference (e.g. ACH trace, Wise ID, check number)",
      "",
    );
    if (ref === null) return;
    start(async () => {
      const r = await markPartnerCommissionPaid({
        commissionId,
        payoutReference: ref,
      });
      if (!r.ok) {
        setError("Couldn't mark paid. Try again.");
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-xs font-semibold text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline disabled:opacity-50"
      >
        {pending ? "Saving…" : "Mark paid"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
