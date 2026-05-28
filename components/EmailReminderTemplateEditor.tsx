"use client";

import { useState, useTransition } from "react";
import { Check, Sparkles } from "lucide-react";
import { saveEmailReminderTemplate } from "@/app/actions/sms";
import { renderEmailReminder } from "@/lib/emailReminderTemplate";
import {
  EMAIL_TEMPLATE_PRESETS,
  type EmailTemplatePreset,
} from "@/lib/communicationTemplates";

const TOKENS = [
  { token: "{amount}", description: "Amount due" },
  { token: "{link}", description: "Stripe payment link" },
  { token: "{customer}", description: "Customer name" },
  { token: "{business}", description: "Your business name" },
];

export function EmailReminderTemplateEditor({
  initial,
  businessName,
}: {
  initial: string;
  businessName: string;
}) {
  const [value, setValue] = useState(
    initial || EMAIL_TEMPLATE_PRESETS[0].body,
  );
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const preview = renderEmailReminder(
    { subject: null, body: value },
    {
      amountCents: 420000,
      payUrl: "https://invoicechase.com/pay/abc123",
      customerName: "Riverside Diner",
      businessName,
    },
  );

  function applyPreset(preset: EmailTemplatePreset) {
    setValue(preset.body);
    setSavedAt(null);
    setError(null);
  }

  function onSave() {
    setError(null);
    start(async () => {
      const r = await saveEmailReminderTemplate(value);
      if (r.ok) {
        setSavedAt(Date.now());
      } else {
        setError(
          r.error === "too_long"
            ? "Template is too long (4,000 chars max)."
            : "Couldn't save. Please try again.",
        );
      }
    });
  }

  const showSaved = savedAt && Date.now() - savedAt < 4000;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-stone-900">Pick a tone</p>
        <p className="mt-0.5 text-xs text-stone-500">
          One click sets your active email. Subject line is auto-built — you
          only need to confirm the body tone you want.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {EMAIL_TEMPLATE_PRESETS.map((preset) => {
            const isActive = value === preset.body;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-xl border p-3 text-left transition ${
                  isActive
                    ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200"
                    : "border-stone-200 bg-white hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-900">
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

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-200 bg-white px-4 py-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Sparkles className="h-3 w-3" aria-hidden /> Live preview
          </p>
        </div>
        <div className="px-4 py-3 text-sm">
          <p className="text-xs text-stone-500">Subject</p>
          <p className="mt-1 font-semibold text-stone-900">{preview.subject}</p>
          <hr className="my-3 border-stone-100" />
          <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">
            {preview.text}
          </p>
        </div>
      </div>

      <details
        open={showAdvanced}
        onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
        className="rounded-xl border border-stone-200 bg-white"
      >
        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 hover:text-stone-700">
          Customize the wording
          <span className="ml-2 text-[10px] font-normal normal-case text-stone-500">
            (optional)
          </span>
        </summary>
        <div className="space-y-3 border-t border-stone-200 p-4">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={10}
            maxLength={4000}
            className="block w-full resize-y rounded-md border-0 px-3 py-2 font-mono text-sm text-stone-900 shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>{value.length} / 4000 characters</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOKENS.map((t) => (
              <button
                key={t.token}
                type="button"
                onClick={() => setValue((v) => v + t.token)}
                title={t.description}
                className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs text-stone-700 hover:bg-slate-200"
              >
                {t.token}
              </button>
            ))}
          </div>
        </div>
      </details>

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
          {pending ? "Saving…" : "Save email template"}
        </button>
        {showSaved ? (
          <span className="text-sm text-emerald-700">Saved</span>
        ) : null}
      </div>
    </div>
  );
}
