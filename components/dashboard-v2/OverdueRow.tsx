"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Send } from "lucide-react";
import type { OverdueInvoice } from "@/lib/dashboard/types";

function fmtUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

type State = "idle" | "sent" | "error";

export function OverdueRow({ item }: { item: OverdueInvoice }) {
  const [state, setState] = useState<State>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function remind() {
    if (!item.hasPhone) return;
    setErrMsg(null);
    start(async () => {
      const res = await fetch("/api/dashboard-v2/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: item.customerId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setState("error");
        setErrMsg(body.error ?? "Send failed");
        return;
      }
      setState("sent");
    });
  }

  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-mk-ink-950">
          {item.customerName}
        </p>
        <p className="mt-0.5 text-[12px] text-mk-ink-500 tabular-nums">
          {fmtUsd(item.amountCents)} · {item.daysLate}d overdue
          {!item.hasPhone ? " · no phone on file" : ""}
        </p>
        {errMsg ? (
          <p className="mt-1 text-[11px] text-mk-danger">{errMsg}</p>
        ) : null}
      </div>
      <RemindButton
        state={state}
        pending={pending}
        disabled={!item.hasPhone}
        onClick={remind}
      />
    </li>
  );
}

function RemindButton({
  state,
  pending,
  disabled,
  onClick,
}: {
  state: State;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  if (state === "sent") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-mk-md bg-mk-accent-50 px-3 py-1.5 text-[12px] font-semibold text-mk-accent-700">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        Sent
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className="inline-flex h-9 items-center gap-1.5 rounded-mk-md bg-mk-ink-950 px-3 text-[12px] font-semibold text-white shadow-mk-1 transition-[background-color,opacity] duration-160 hover:bg-mk-ink-800 focus-visible:outline-none focus-visible:shadow-mk-focus disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      Remind
    </button>
  );
}
