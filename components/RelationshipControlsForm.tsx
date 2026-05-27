"use client";

import { useState, useTransition } from "react";
import {
  Bell,
  CalendarOff,
  CheckCircle2,
  Heart,
  Inbox,
  Star,
} from "lucide-react";
import type { CashflowConfig } from "@/lib/server/db/cashflow";

export function RelationshipControlsForm({ config }: { config: CashflowConfig }) {
  const [thankYou, setThankYou] = useState(config.thankYouOnPaymentEnabled);
  const [review, setReview] = useState(config.reviewRequestEnabled);
  const [reviewUrl, setReviewUrl] = useState(config.reviewRequestUrl ?? "");
  const [approval, setApproval] = useState(config.approvalQueueEnabled);
  const [pauseEnd, setPauseEnd] = useState<string>(
    config.seasonalPauseUntil
      ? new Date(config.seasonalPauseUntil).toISOString().slice(0, 10)
      : "",
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
      setSaved(res.ok ? "Saved" : "Failed");
      setTimeout(() => setSaved(null), 1500);
    });
  }

  return (
    <div className="space-y-5">
      {saved ? (
        <div className="fixed right-6 top-20 z-10 inline-flex items-center gap-2 rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          {saved}
        </div>
      ) : null}

      <Section
        icon={Heart}
        title="Thank-you SMS on payment"
        body="Auto-text a short thank-you when a payment is received. Customers feel valued, you spend zero time."
      >
        <Toggle
          checked={thankYou}
          onChange={(v) => {
            setThankYou(v);
            save({ thankYouOnPaymentEnabled: v });
          }}
          label={thankYou ? "On" : "Off"}
          hint={
            thankYou
              ? "Sends: 'Thanks Maria! We received your $1,240 payment to Honest Plumbing.'"
              : "Customers get the email receipt only."
          }
        />
      </Section>

      <Section
        icon={Star}
        title="Auto review request"
        body="After payment lands, send a follow-up asking for a quick Google/Yelp review. Highest converting moment in your business cycle."
      >
        <Toggle
          checked={review}
          onChange={(v) => {
            setReview(v);
            save({ reviewRequestEnabled: v });
          }}
          label={review ? "On" : "Off"}
        />
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Review URL (Google Maps / Yelp / Trustpilot)
          </span>
          <input
            type="url"
            value={reviewUrl}
            onChange={(e) => setReviewUrl(e.target.value)}
            onBlur={() => save({ reviewRequestUrl: reviewUrl })}
            placeholder="https://g.page/r/your-business/review"
            className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </label>
      </Section>

      <Section
        icon={Inbox}
        title="Owner approval queue"
        body="When on, every AI-drafted message lands in /approvals for owner review before sending. Use during onboarding or for sensitive accounts."
      >
        <Toggle
          checked={approval}
          onChange={(v) => {
            setApproval(v);
            save({ approvalQueueEnabled: v });
          }}
          label={approval ? "All AI sends require approval" : "AI sends automatically"}
        />
      </Section>

      <Section
        icon={CalendarOff}
        title="Seasonal pause"
        body="Pause all autopilot sends until a date. Good for Christmas week, your busy season, or storm response."
      >
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Pause until
          </span>
          <input
            type="date"
            value={pauseEnd}
            onChange={(e) => setPauseEnd(e.target.value)}
            onBlur={() =>
              save({
                seasonalPauseUntil: pauseEnd
                  ? new Date(pauseEnd).getTime()
                  : null,
              })
            }
            className="mt-1 block w-48 rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </label>
        {pauseEnd ? (
          <button
            type="button"
            onClick={() => {
              setPauseEnd("");
              save({ seasonalPauseUntil: null });
            }}
            className="text-xs font-medium text-stone-500 hover:text-stone-100"
          >
            Resume immediately
          </button>
        ) : null}
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: typeof Bell;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-stone-900/70 p-6 shadow-sm ring-1 ring-stone-800">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold text-stone-100">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-stone-400">{body}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3 pl-13">{children}</div>
    </section>
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
          className={`inline-block h-4 w-4 transform rounded-full bg-stone-900/70 shadow transition ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-semibold text-stone-100">{label}</p>
        {hint ? <p className="text-xs text-stone-500">{hint}</p> : null}
      </div>
    </div>
  );
}
