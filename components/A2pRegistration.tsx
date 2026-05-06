"use client";

import { useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { saveA2pRegistration } from "@/app/actions/org";

type Initial = {
  legalBusinessName: string;
  businessEin: string;
  brandId: string;
  campaignId: string;
  brandStatus: string;
  campaignStatus: string;
};

const STATUSES: { value: string; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  submitted: "bg-amber-50 text-amber-800 ring-amber-200",
  in_review: "bg-amber-50 text-amber-800 ring-amber-200",
  not_started: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function A2pRegistration({ initial }: { initial: Initial }) {
  const [v, setV] = useState<Initial>(initial);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const showSaved = savedAt && Date.now() - savedAt < 4000;

  function update<K extends keyof Initial>(key: K, value: Initial[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  function onSave() {
    start(async () => {
      const r = await saveA2pRegistration(v);
      if (r.ok) setSavedAt(Date.now());
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        US carriers require A2P 10DLC brand + campaign registration before
        we can send your texts at scale. Register at the Twilio console, then
        paste the IDs and statuses here so we can mark you cleared. Without
        this we&apos;ll throttle to test rates.
      </p>
      <a
        href="https://console.twilio.com/us1/develop/sms/regulatory-compliance"
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
      >
        Open Twilio console
        <ExternalLink className="h-3 w-3" aria-hidden />
      </a>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Legal business name
          </span>
          <input
            type="text"
            value={v.legalBusinessName}
            onChange={(e) => update("legalBusinessName", e.target.value)}
            maxLength={200}
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">EIN</span>
          <input
            type="text"
            value={v.businessEin}
            onChange={(e) => update("businessEin", e.target.value)}
            maxLength={32}
            placeholder="12-3456789"
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 font-mono text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Brand ID</span>
          <input
            type="text"
            value={v.brandId}
            onChange={(e) => update("brandId", e.target.value)}
            maxLength={64}
            placeholder="BNxxxxxxxxxxxxxxxx"
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 font-mono text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Brand status
          </span>
          <select
            value={v.brandStatus}
            onChange={(e) => update("brandStatus", e.target.value)}
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Campaign ID
          </span>
          <input
            type="text"
            value={v.campaignId}
            onChange={(e) => update("campaignId", e.target.value)}
            maxLength={64}
            placeholder="CMxxxxxxxxxxxxxxxx"
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 font-mono text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Campaign status
          </span>
          <select
            value={v.campaignStatus}
            onChange={(e) => update("campaignStatus", e.target.value)}
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <Pill label={`Brand: ${v.brandStatus}`} status={v.brandStatus} />
        <Pill label={`Campaign: ${v.campaignStatus}`} status={v.campaignStatus} />
        {v.campaignStatus === "approved" ? (
          <span className="text-emerald-700">SMS sending unlocked.</span>
        ) : (
          <span className="text-slate-500">
            We&apos;ll throttle to test rates until approved.
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {showSaved ? (
          <span className="text-sm text-emerald-700">Saved</span>
        ) : null}
      </div>
    </div>
  );
}

function Pill({ label, status }: { label: string; status: string }) {
  const cls =
    STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}
