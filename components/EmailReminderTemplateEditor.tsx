"use client";

import { useState, useTransition } from "react";
import { saveEmailReminderTemplate } from "@/app/actions/sms";
import {
  DEFAULT_EMAIL_BODY,
  renderEmailReminder,
} from "@/lib/emailReminderTemplate";

const PLACEHOLDERS: { token: string; description: string }[] = [
  { token: "{amount}", description: "Amount due, e.g. $4,200.00" },
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
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = renderEmailReminder(
    { subject: null, body: value },
    {
      amountCents: 420000,
      payUrl: "https://invoicechase.com/pay/abc123",
      customerName: "Riverside Diner",
      businessName,
    },
  );

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

  function onReset() {
    setValue("");
  }

  const showSaved = savedAt && Date.now() - savedAt < 4000;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-slate-900">
          Email reminder body
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Plain text. Use the tokens below. Leave empty to fall back to the
          default. Subject line is auto-generated.
        </p>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={8}
          maxLength={4000}
          placeholder={DEFAULT_EMAIL_BODY}
          className="mt-2 block w-full resize-y rounded-md border-0 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span>{value.length} / 4000 characters</span>
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
        {PLACEHOLDERS.map((p) => (
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

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Preview ({preview.subject})
        </p>
        <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
          {preview.text}
        </p>
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
