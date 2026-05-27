"use client";

import { useState, useTransition } from "react";
import { Check, Sparkles } from "lucide-react";
import { saveSmsTemplate } from "@/app/actions/sms";
import {
  DEFAULT_SMS_TEMPLATE,
  renderSmsBody,
} from "@/lib/smsTemplate";
import {
  SMS_TEMPLATE_PRESETS,
  type SmsTemplatePreset,
} from "@/lib/communicationTemplates";

const TOKENS = [
  { token: "{amount}", description: "Amount due" },
  { token: "{link}", description: "Stripe payment link" },
  { token: "{customer}", description: "Customer name" },
  { token: "{business}", description: "Your business name" },
];

export function SmsTemplateEditor({
  initial,
  businessName,
}: {
  initial: string;
  businessName: string;
}) {
  const [value, setValue] = useState(initial || SMS_TEMPLATE_PRESETS[1].body);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const preview = renderSmsBody(value, {
    amountCents: 420000,
    payUrl: "https://invoicechase.com/pay/abc123",
    customerName: "Riverside Diner",
    businessName,
  });

  function applyPreset(preset: SmsTemplatePreset) {
    setValue(preset.body);
    setSavedAt(null);
    setError(null);
  }

  function onSave() {
    setError(null);
    start(async () => {
      const r = await saveSmsTemplate(value);
      if (r.ok) {
        setSavedAt(Date.now());
      } else {
        setError(
          r.error === "too_long"
            ? "Template is too long (320 chars max)."
            : "Couldn't save. Please try again.",
        );
      }
    });
  }

  const showSaved = savedAt && Date.now() - savedAt < 4000;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-stone-100">Pick a tone</p>
        <p className="mt-0.5 text-xs text-stone-500">
          One click sets your active template. Tweak anything if you want — most
          owners don&apos;t need to.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SMS_TEMPLATE_PRESETS.map((preset) => {
            const isActive = value === preset.body;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-xl border p-3 text-left transition ${
                  isActive
                    ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200"
                    : "border-stone-800 bg-stone-900/70 hover:border-slate-300 hover:bg-stone-950"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-100">
                    {preset.name}
                  </span>
                  {isActive ? (
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
          <Sparkles className="h-3 w-3" aria-hidden /> Live preview · what the
          customer sees
        </p>
        <p className="mt-2 whitespace-pre-wrap font-mono text-xs leading-relaxed">
          {preview}
        </p>
      </div>

      <details
        open={showAdvanced}
        onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
        className="rounded-xl border border-stone-800 bg-stone-900/70"
      >
        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 hover:text-stone-300">
          Customize the wording
          <span className="ml-2 text-[10px] font-normal normal-case text-stone-500">
            (optional)
          </span>
        </summary>
        <div className="space-y-3 border-t border-stone-800 p-4">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            maxLength={320}
            placeholder={DEFAULT_SMS_TEMPLATE}
            className="block w-full resize-none rounded-md border-0 px-3 py-2 font-mono text-sm text-stone-100 shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>{value.length} / 320 characters</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOKENS.map((t) => (
              <button
                key={t.token}
                type="button"
                onClick={() => setValue((v) => v + t.token)}
                title={t.description}
                className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs text-stone-300 hover:bg-slate-200"
              >
                {t.token}
              </button>
            ))}
          </div>
        </div>
      </details>

      <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
        Recipients can reply <span className="font-mono">STOP</span> to opt out
        or <span className="font-mono">HELP</span> for instructions at any
        time. We honor STOP automatically.
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending ? "Saving…" : "Save template"}
        </button>
        {showSaved ? (
          <span className="text-sm text-emerald-700">Saved</span>
        ) : null}
      </div>
    </div>
  );
}
