"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Loader2,
  Send,
  ShieldCheck,
} from "lucide-react";

type PreviewItem = {
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  amountCents: number;
  daysLate: number;
  eligible: boolean;
  skipReason: string | null;
};

type Preview = {
  batchId: number;
  status: string;
  totalAtRiskCents: number;
  eligibleCount: number;
  skippedCount: number;
  items: PreviewItem[];
};

const SKIP_REASON_LABEL: Record<string, string> = {
  no_phone: "No phone on file",
  invalid_phone: "Phone number isn't valid",
  zero_balance: "No balance owed",
  opted_out: "Customer opted out of SMS",
  a2p_not_approved: "10DLC registration pending",
};

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function FirstWinReview({ preview }: { preview: Preview }) {
  const router = useRouter();
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  const eligible = useMemo(
    () => preview.items.filter((i) => i.eligible),
    [preview.items],
  );
  const skipped = useMemo(
    () => preview.items.filter((i) => !i.eligible),
    [preview.items],
  );

  const willSendCount = eligible.filter((i) => !excluded.has(i.customerId))
    .length;
  const willSendDollars = eligible
    .filter((i) => !excluded.has(i.customerId))
    .reduce((s, i) => s + i.amountCents, 0);

  function toggle(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function approve() {
    if (willSendCount === 0) return;
    setErr(null);
    start(async () => {
      const res = await fetch("/api/onboarding/first-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exclude: Array.from(excluded) }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErr(body.error ?? "Approval failed.");
        return;
      }
      const data = (await res.json()) as { queuedCount: number };
      setSuccess(data.queuedCount);
      setTimeout(() => router.push("/dashboard?first_win=approved"), 1500);
    });
  }

  if (preview.items.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-stone-200">
        <Inbox className="mx-auto h-10 w-10 text-orange-500" aria-hidden />
        <h2 className="font-display mt-4 text-xl font-bold text-stone-900">
          No overdue invoices right now
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Nice work. We&apos;ll text customers automatically as soon as their
          first invoice goes past due.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700"
        >
          Open dashboard
        </a>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero — total $ at risk + send count */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat
            label="Total at risk"
            value={fmt(preview.totalAtRiskCents)}
            tone="primary"
          />
          <Stat
            label="Customers to text"
            value={willSendCount.toString()}
            tone="success"
          />
          <Stat
            label="Sending"
            value={fmt(willSendDollars)}
            tone="default"
          />
        </div>
        <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs text-stone-500">
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden
            />
            <p>
              Sends throttled (max ~5 per 15 min). Only during 8am–9pm
              local. Every message includes <strong>Reply STOP to opt
              out</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={approve}
            disabled={pending || willSendCount === 0 || success != null}
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50"
          >
            {success != null ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Queued {success} sends
              </>
            ) : pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Queuing…
              </>
            ) : (
              <>
                <Send className="h-4 w-4 transition group-hover:translate-x-0.5" />
                Start collecting · {willSendCount}
              </>
            )}
          </button>
        </div>
        {err ? (
          <p className="mt-3 text-xs text-red-700">{err}</p>
        ) : null}
      </section>

      {/* Eligible list with checkboxes */}
      {eligible.length > 0 ? (
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
          <div className="border-b border-stone-200 bg-stone-50/60 px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              {eligible.length} ready to text
            </p>
          </div>
          {eligible.map((it) => {
            const isExcluded = excluded.has(it.customerId);
            return (
              <label
                key={it.customerId}
                className={`flex items-center gap-3 border-b border-stone-100 px-5 py-3 last:border-b-0 ${
                  isExcluded ? "opacity-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={!isExcluded}
                  onChange={() => toggle(it.customerId)}
                  className="h-4 w-4 cursor-pointer rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {it.customerName}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {it.customerPhone} · {it.daysLate}d overdue
                  </p>
                </div>
                <p className="font-display text-sm font-semibold tabular-nums text-stone-900">
                  {fmt(it.amountCents)}
                </p>
              </label>
            );
          })}
        </section>
      ) : null}

      {/* Skipped — show owners which were filtered and why */}
      {skipped.length > 0 ? (
        <section className="overflow-hidden rounded-2xl bg-amber-50 shadow-sm ring-1 ring-amber-200">
          <div className="flex items-center gap-2 border-b border-amber-200 px-5 py-3">
            <AlertTriangle
              className="h-3.5 w-3.5 text-amber-700"
              aria-hidden
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
              {skipped.length} skipped (you can fix and try again)
            </p>
          </div>
          {skipped.map((it) => (
            <div
              key={it.customerId}
              className="flex items-center gap-3 border-b border-amber-200/60 px-5 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">
                  {it.customerName}
                </p>
                <p className="text-[11px] text-amber-800">
                  {SKIP_REASON_LABEL[it.skipReason ?? ""] ??
                    it.skipReason ??
                    "Skipped"}
                </p>
              </div>
              <p className="text-xs tabular-nums text-stone-600">
                {fmt(it.amountCents)}
              </p>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "success" | "default";
}) {
  const valueClass =
    tone === "primary"
      ? "text-orange-700"
      : tone === "success"
        ? "text-emerald-700"
        : "text-stone-900";
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <p className={`font-display mt-1 text-2xl font-bold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}
