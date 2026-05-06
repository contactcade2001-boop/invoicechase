"use client";

import { useState, useTransition } from "react";
import { saveSmsTemplate } from "@/app/actions/sms";
import {
  DEFAULT_SMS_TEMPLATE,
  SMS_PLACEHOLDERS,
  renderSmsBody,
} from "@/lib/smsTemplate";

export function SmsTemplateEditor({
  initial,
  businessName,
}: {
  initial: string;
  businessName: string;
}) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = renderSmsBody(value, {
    amountCents: 420000,
    payUrl: "https://invoicechase.com/pay/abc123",
    customerName: "Riverside Diner",
    businessName,
  });

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

  function onReset() {
    setValue("");
  }

  const showSaved = savedAt && Date.now() - savedAt < 4000;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-slate-900">
          Message template
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Use the tokens below to interpolate values. Leave empty to fall back
          to the default.
        </p>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          maxLength={320}
          placeholder={DEFAULT_SMS_TEMPLATE}
          className="mt-2 block w-full resize-none rounded-md border-0 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span>{value.length} / 320 characters</span>
          <button
            type="button"
            onClick={onReset}
            className="text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            Reset to default
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SMS_PLACEHOLDERS.map((p) => (
          <button
            key={p.token}
            type="button"
            onClick={() => setValue((v) => v + p.token)}
            title={p.description}
            className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs text-slate-700 hover:bg-slate-200"
          >
            {p.token}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Preview
        </p>
        <p className="mt-1.5 whitespace-pre-wrap font-mono text-xs">
          {preview}
        </p>
      </div>

      <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
        Recipients can reply <span className="font-mono">STOP</span> to opt out
        or <span className="font-mono">HELP</span> for instructions at any
        time. We honor STOP automatically — no further texts will be sent to
        that customer until they reply <span className="font-mono">START</span>.
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
