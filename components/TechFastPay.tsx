"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Check,
  ChevronLeft,
  CreditCard,
  Loader2,
  MessageSquare,
  Search,
} from "lucide-react";
import { getPayLinkUrl } from "@/app/actions/pay";
import { sendTextToCustomer } from "@/app/actions/sms";
import { describeDays, formatCurrencyDetailed } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { payErrorMessage, smsErrorMessage } from "./smsErrors";

type Status =
  | { kind: "idle" }
  | { kind: "sent"; phone: string }
  | { kind: "linked"; url: string }
  | { kind: "error"; message: string };

export function TechFastPay({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [textPending, startText] = useTransition();
  const [linkPending, startLink] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const owesMoney = customers.filter((c) => c.amountOwed > 0);
    if (!q) {
      return [...owesMoney].sort((a, b) => b.daysLate - a.daysLate);
    }
    return owesMoney.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, query]);

  function reset() {
    setSelected(null);
    setStatus({ kind: "idle" });
  }

  function onSendText() {
    if (!selected) return;
    setStatus({ kind: "idle" });
    startText(async () => {
      const r = await sendTextToCustomer(selected.id);
      if (r.ok) {
        setStatus({ kind: "sent", phone: selected.phone });
      } else {
        setStatus({ kind: "error", message: smsErrorMessage(r.error) });
      }
    });
  }

  function onCopyLink() {
    if (!selected) return;
    setStatus({ kind: "idle" });
    startLink(async () => {
      const r = await getPayLinkUrl(selected.id);
      if (r.ok) {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(r.url);
          } catch {
            // fall through to showing the URL
          }
        }
        setStatus({ kind: "linked", url: r.url });
      } else {
        setStatus({ kind: "error", message: payErrorMessage(r.error) });
      }
    });
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-stone-100"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </button>

        <div className="rounded-2xl bg-stone-900/70 p-6 shadow-sm ring-1 ring-stone-800">
          <h2 className="text-2xl font-bold tracking-tight">
            {selected.name}
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            {selected.phone || "No phone on file"}
          </p>

          <div className="mt-5 rounded-xl bg-stone-950 p-4 ring-1 ring-stone-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Amount due
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {formatCurrencyDetailed(selected.amountOwed)}
            </p>
            <p
              className={`mt-1 text-sm font-medium tabular-nums ${
                selected.daysLate > 0 ? "text-red-600" : "text-stone-500"
              }`}
            >
              {describeDays(selected.daysLate)}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onSendText}
              disabled={textPending || !selected.phone}
              title={!selected.phone ? "No phone on file" : undefined}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-stone-500"
            >
              {textPending ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <MessageSquare className="h-5 w-5" aria-hidden />
              )}
              {textPending ? "Sending…" : "Send Fast-Pay text"}
            </button>
            <button
              type="button"
              onClick={onCopyLink}
              disabled={linkPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {linkPending ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <CreditCard className="h-5 w-5" aria-hidden />
              )}
              {linkPending ? "Generating…" : "Copy payment link"}
            </button>
          </div>

          {status.kind === "sent" ? (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
              <Check className="h-4 w-4" aria-hidden />
              Sent to {status.phone}.
            </div>
          ) : null}
          {status.kind === "linked" ? (
            <div className="mt-4 rounded-md bg-stone-950 px-3 py-2 text-sm ring-1 ring-inset ring-stone-800">
              <p className="font-semibold text-stone-100">
                Link copied to clipboard
              </p>
              <p className="mt-1 break-all text-xs text-stone-400">
                {status.url}
              </p>
            </div>
          ) : null}
          {status.kind === "error" ? (
            <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
              {status.message}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500"
          aria-hidden
        />
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customer…"
          autoFocus
          className="w-full rounded-lg border-0 bg-stone-900/70 py-3.5 pl-11 pr-4 text-base shadow-sm ring-1 ring-inset ring-stone-700 placeholder:text-stone-500 focus:ring-2 focus:ring-inset focus:ring-slate-900"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-stone-900/70 p-8 text-center shadow-sm ring-1 ring-stone-800">
          <p className="text-sm text-stone-400">
            {query
              ? "No customers match that search."
              : "No customers with outstanding balances."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-stone-900/70 shadow-sm ring-1 ring-stone-800">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c)}
              className="flex w-full items-center justify-between gap-4 border-b border-stone-800/60 px-4 py-4 text-left last:border-b-0 transition hover:bg-stone-950 active:bg-slate-100"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-medium text-stone-100">
                  {c.name}
                </div>
                <div
                  className={`text-sm tabular-nums ${
                    c.daysLate > 0 ? "text-red-600" : "text-stone-500"
                  }`}
                >
                  {describeDays(c.daysLate)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-semibold tabular-nums">
                  {formatCurrencyDetailed(c.amountOwed)}
                </div>
                {c.phone ? (
                  <div className="text-xs text-stone-500">has phone</div>
                ) : (
                  <div className="text-xs text-amber-600">no phone</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
