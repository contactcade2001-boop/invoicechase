"use client";

import { useState, useTransition } from "react";
import {
  Banknote,
  Building2,
  Check,
  Clock,
  Percent,
  Sparkles,
  Zap,
} from "lucide-react";
import type { CashflowConfig } from "@/lib/server/db/cashflow";

export function CashflowControlsForm({ config }: { config: CashflowConfig }) {
  const [earlyPct, setEarlyPct] = useState(config.earlyPayDiscountBps / 100);
  const [earlyDays, setEarlyDays] = useState(config.earlyPayDays);
  const [achPct, setAchPct] = useState(config.achDiscountBps / 100);
  const [lateFeePct, setLateFeePct] = useState(config.lateFeeBps / 100);
  const [lateStart, setLateStart] = useState(config.lateFeeStartDays);
  const [preDue, setPreDue] = useState(config.preDueReminderDays);
  const [smartSend, setSmartSend] = useState(config.smartSendTimesEnabled);
  const [bankDollars, setBankDollars] = useState(
    config.bankBalanceCents ? Math.round(config.bankBalanceCents / 100) : 0,
  );
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  function save(patch: Record<string, unknown>) {
    start(async () => {
      const res = await fetch("/api/cashflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        setSaved("Saved");
        setTimeout(() => setSaved(null), 1800);
      } else {
        setSaved("Failed");
      }
    });
  }

  return (
    <div className="space-y-5">
      {saved ? (
        <div className="fixed right-6 top-20 z-10 inline-flex items-center gap-2 rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
          <Check className="h-3 w-3 text-emerald-400" />
          {saved}
        </div>
      ) : null}

      <Section
        icon={Sparkles}
        title="Early-payment discount"
        body="Reward customers who pay before the due date. Most owners see 30-50% adoption — money lands in days, not weeks."
        lift="High lift"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label="Discount %"
            value={earlyPct}
            step={0.5}
            min={0}
            max={10}
            onCommit={(v) => {
              setEarlyPct(v);
              save({ earlyPayDiscountBps: Math.round(v * 100) });
            }}
            suffix="%"
          />
          <NumberField
            label="Days from invoice issue"
            value={earlyDays}
            step={1}
            min={1}
            max={30}
            onCommit={(v) => {
              setEarlyDays(v);
              save({ earlyPayDays: v });
            }}
            suffix="d"
          />
        </div>
        <Preview
          label="On a $2,000 invoice"
          value={`$${(2000 * (1 - earlyPct / 100)).toFixed(2)}`}
          hint={`Customer saves $${((2000 * earlyPct) / 100).toFixed(2)} if paid within ${earlyDays} days.`}
        />
      </Section>

      <Section
        icon={Banknote}
        title="ACH discount"
        body="Steer customers off cards (which can reverse) and onto ACH. Saves you 2.9% in Stripe fees too."
        lift="High lift"
      >
        <NumberField
          label="ACH discount %"
          value={achPct}
          step={0.5}
          min={0}
          max={5}
          onCommit={(v) => {
            setAchPct(v);
            save({ achDiscountBps: Math.round(v * 100) });
          }}
          suffix="%"
        />
      </Section>

      <Section
        icon={Clock}
        title="Pre-due reminder"
        body="Text customers BEFORE the due date with a friendly heads-up. Preempts ~half of would-be late payments."
        lift="Huge lift"
      >
        <NumberField
          label="Days before due"
          value={preDue}
          step={1}
          min={0}
          max={14}
          onCommit={(v) => {
            setPreDue(v);
            save({ preDueReminderDays: v });
          }}
          suffix="d"
        />
        {preDue > 0 ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800 ring-1 ring-inset ring-emerald-200">
            ✓ Pre-due reminders will fire {preDue} days before each invoice
            comes due. Tone matches your active SMS template.
          </p>
        ) : null}
      </Section>

      <Section
        icon={Percent}
        title="Auto late fees"
        body="Compound monthly past a grace period. State-aware caps apply automatically."
        lift="Recovers bad debt"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label="Monthly fee %"
            value={lateFeePct}
            step={0.25}
            min={0}
            max={5}
            onCommit={(v) => {
              setLateFeePct(v);
              save({ lateFeeBps: Math.round(v * 100) });
            }}
            suffix="%/mo"
          />
          <NumberField
            label="Grace period"
            value={lateStart}
            step={1}
            min={0}
            max={90}
            onCommit={(v) => {
              setLateStart(v);
              save({ lateFeeStartDays: v });
            }}
            suffix="d"
          />
        </div>
        <Preview
          label={`$5,000 invoice, 60 days late → fee`}
          value={`$${(5000 * (lateFeePct / 100) * Math.max(0, (60 - lateStart) / 30)).toFixed(2)}`}
        />
      </Section>

      <Section
        icon={Zap}
        title="Smart send-times"
        body="Claude picks the hour-of-day for each customer based on when they've replied historically. Reply rates jump 30-50%."
        lift="High lift"
      >
        <Toggle
          checked={smartSend}
          onChange={(v) => {
            setSmartSend(v);
            save({ smartSendTimesEnabled: v });
          }}
          label={smartSend ? "Enabled" : "Disabled"}
          hint={
            smartSend
              ? "AI routes reminders to each customer's best response window."
              : "Reminders fire at your default send hour for everyone."
          }
        />
      </Section>

      <Section
        icon={Building2}
        title="Cash on hand"
        body="Enter your latest bank balance or connect Plaid for live updates. Powers the runway widget."
        lift="Owner visibility"
        comingSoon="Plaid live sync"
      >
        <NumberField
          label="Bank balance (USD)"
          value={bankDollars}
          step={100}
          min={0}
          max={9_999_999}
          onCommit={(v) => {
            setBankDollars(v);
            save({ bankBalanceDollars: v });
          }}
          suffix=""
          prefix="$"
        />
        <p className="text-[11px] text-stone-500">
          Last refreshed:{" "}
          {config.bankBalanceRefreshedAt
            ? new Date(config.bankBalanceRefreshedAt).toLocaleString()
            : "never"}
        </p>
      </Section>

      <div className="rounded-2xl bg-orange-600 p-6 text-white shadow-lg">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
          Coming soon — partner integrations
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-stone-800 sm:grid-cols-2">
          <li>• Working capital advance (factor your AR)</li>
          <li>• Send to collections (1-click handoff)</li>
          <li>• Service-plan recurring billing</li>
          <li>• Vendor pay (bills outflow)</li>
        </ul>
      </div>
      {pending ? null : null}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  body,
  children,
  lift,
  comingSoon,
}: {
  icon: typeof Banknote;
  title: string;
  body: string;
  children: React.ReactNode;
  lift?: string;
  comingSoon?: string;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="font-display text-base font-semibold text-stone-900">
              {title}
            </h2>
            {lift ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-200">
                {lift}
              </span>
            ) : null}
            {comingSoon ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200">
                {comingSoon}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-stone-600">{body}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3 pl-13">{children}</div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onCommit,
  step,
  min,
  max,
  suffix,
  prefix,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  step: number;
  min: number;
  max: number;
  suffix?: string;
  prefix?: string;
}) {
  const [local, setLocal] = useState(value);
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </span>
      <div className="mt-1 flex items-center rounded-md bg-white shadow-sm ring-1 ring-inset ring-stone-300 focus-within:ring-2 focus-within:ring-stone-900">
        {prefix ? (
          <span className="pl-2.5 text-sm font-semibold text-stone-500">
            {prefix}
          </span>
        ) : null}
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={local}
          onChange={(e) => setLocal(parseFloat(e.target.value) || 0)}
          onBlur={() => onCommit(local)}
          className="flex-1 border-0 bg-transparent px-2.5 py-2 text-sm tabular-nums text-stone-900 focus:outline-none"
        />
        {suffix ? (
          <span className="pr-2.5 text-xs font-semibold text-stone-500">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function Preview({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md bg-white px-3 py-2 text-xs ring-1 ring-inset ring-stone-200">
      <p className="text-stone-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-stone-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-stone-500">{hint}</p> : null}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
          checked ? "bg-orange-600" : "bg-stone-300"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-semibold text-stone-900">{label}</p>
        {hint ? <p className="text-xs text-stone-500">{hint}</p> : null}
      </div>
    </div>
  );
}
