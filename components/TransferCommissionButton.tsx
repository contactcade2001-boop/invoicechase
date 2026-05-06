"use client";

import { useState, useTransition } from "react";
import { transferPartnerCommission } from "@/app/actions/partner";

const messages: Record<string, string> = {
  not_signed_in: "Please sign in again.",
  not_a_partner: "You're not a partner yet.",
  stripe_not_connected: "Set up Stripe payouts above first.",
  already_paid: "Already paid.",
  zero_amount: "Nothing to transfer.",
  not_found: "Commission not found.",
  transfer_failed: "Stripe rejected the transfer. Try again later.",
};

export function TransferCommissionButton({
  commissionId,
  enabled,
}: {
  commissionId: number;
  enabled: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    start(async () => {
      const r = await transferPartnerCommission(commissionId);
      if (!r.ok) {
        setError(messages[r.error] ?? "Couldn't transfer.");
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending || !enabled}
        title={
          !enabled
            ? "Connect Stripe payouts on this dashboard first"
            : undefined
        }
        className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:text-emerald-900 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Transferring…" : "Transfer to Stripe"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
