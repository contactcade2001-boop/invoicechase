"use client";

import { useState, useTransition } from "react";
import { Bot, Loader2 } from "lucide-react";
import {
  provisionTwilioNumber,
  saveDepositConfig,
  saveDigestPhone,
  saveTwilioPhone,
  setAutopilotEnabled,
  setDepositEnabled,
} from "@/app/actions/org";

export function AutomationSettings({
  initial,
}: {
  initial: {
    autopilotEnabled: boolean;
    depositEnabled: boolean;
    depositPercentBps: number;
    depositThresholdScore: number;
    digestPhone: string;
    twilioPhone: string;
  };
}) {
  const [autopilot, setAutopilot] = useState(initial.autopilotEnabled);
  const [deposit, setDeposit] = useState(initial.depositEnabled);
  const [percent, setPercent] = useState(
    String(initial.depositPercentBps / 100),
  );
  const [threshold, setThreshold] = useState(
    String(initial.depositThresholdScore),
  );
  const [phone, setPhone] = useState(initial.digestPhone);
  const [twilioPhone, setTwilioPhoneState] = useState(initial.twilioPhone);
  const [twilioError, setTwilioError] = useState<string | null>(null);
  const [areaCode, setAreaCode] = useState("");
  const [pending, start] = useTransition();
  const [savedTag, setSavedTag] = useState<string | null>(null);

  function flagPending(tag: string, fn: () => Promise<unknown>) {
    setSavedTag(null);
    start(async () => {
      await fn();
      setSavedTag(tag);
      setTimeout(() => setSavedTag(null), 2500);
    });
  }

  function onAutopilot(next: boolean) {
    setAutopilot(next);
    flagPending("autopilot", () => setAutopilotEnabled(next));
  }

  function onDeposit(next: boolean) {
    setDeposit(next);
    flagPending("deposit", () => setDepositEnabled(next));
  }

  function onSaveDeposit() {
    flagPending("deposit-config", () =>
      saveDepositConfig({
        percentBps: Math.round(Number(percent) * 100),
        thresholdScore: Number(threshold),
      }),
    );
  }

  function onSavePhone() {
    flagPending("phone", () => saveDigestPhone(phone));
  }

  function onSaveTwilioPhone() {
    setTwilioError(null);
    setSavedTag(null);
    start(async () => {
      const r = await saveTwilioPhone(twilioPhone);
      if (r.ok) {
        setSavedTag("twilio-phone");
        setTimeout(() => setSavedTag(null), 2500);
      } else {
        setTwilioError(
          r.error === "invalid_phone"
            ? "Use E.164 format, e.g. +14155551234."
            : r.error,
        );
      }
    });
  }

  function onProvisionTwilio() {
    setTwilioError(null);
    setSavedTag(null);
    start(async () => {
      const r = await provisionTwilioNumber(areaCode || undefined);
      if (r.ok) {
        setTwilioPhoneState(r.phoneNumber);
        setSavedTag("twilio-phone");
        setTimeout(() => setSavedTag(null), 2500);
      } else {
        const message: Record<string, string> = {
          no_active_subscription:
            "Activate your subscription before provisioning a number.",
          invalid_area_code: "Area code must be 3 digits (e.g. 415).",
          search_failed: "Twilio search failed. Try a different area code.",
          none_available:
            "No SMS-capable numbers available for that area code right now.",
          purchase_failed: "Twilio rejected the purchase. Check your account.",
          forbidden: "Only the owner can provision a number.",
        };
        setTwilioError(message[r.error] ?? r.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Bot className="h-5 w-5 text-slate-700" aria-hidden />
              Autopilot
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              When customers reply to a Fast-Pay text, Claude drafts and sends
              the response automatically. Replies stay polite, brief, and
              never agree to discounts or extensions on your behalf.
            </p>
          </div>
          <Toggle
            checked={autopilot}
            onChange={onAutopilot}
            disabled={pending}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Requires <code className="font-mono">ANTHROPIC_API_KEY</code> in your
          server environment.
        </p>
        {pending && savedTag === null ? (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Saving…
          </p>
        ) : null}
        {savedTag === "autopilot" ? (
          <p className="mt-2 text-xs text-emerald-700">Saved</p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Deposit collection</h2>
            <p className="mt-1 text-sm text-slate-600">
              Auto-text a deposit request to high-risk customers when a new
              invoice is created in QuickBooks.
            </p>
          </div>
          <Toggle
            checked={deposit}
            onChange={onDeposit}
            disabled={pending}
          />
        </div>
        {deposit ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Deposit percent
              </span>
              <div className="mt-1 flex rounded-md shadow-sm ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-slate-900">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  className="block w-full rounded-l-md border-0 bg-transparent px-3 py-2 text-sm focus:outline-none"
                />
                <span className="inline-flex items-center rounded-r-md bg-slate-50 px-3 text-sm text-slate-500">
                  %
                </span>
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Trigger when reputation below
              </span>
              <input
                type="number"
                min={300}
                max={850}
                step={10}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
              />
              <span className="mt-1 block text-xs text-slate-500">
                300–850 (lower = stricter)
              </span>
            </label>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={onSaveDeposit}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Save deposit settings
              </button>
              {savedTag === "deposit-config" ? (
                <span className="ml-3 text-sm text-emerald-700">Saved</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold">Weekly digest</h2>
        <p className="mt-1 text-sm text-slate-600">
          Every Monday at 9 AM, we&apos;ll text you a summary of outstanding
          AR — total owed, count overdue, biggest debtor.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+15125551234"
            className="flex-1 rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
          <button
            type="button"
            onClick={onSavePhone}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Save number
          </button>
        </div>
        {savedTag === "phone" ? (
          <p className="mt-2 text-xs text-emerald-700">Saved</p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">
          Leave blank to disable digests. Use E.164 format (e.g. +15125551234).
        </p>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold">Your Twilio number</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use a dedicated Twilio number for your business. We&apos;ll send
          customer texts from this number and route inbound replies (with
          autopilot) back to your account. Leave blank to use the platform
          shared number.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Point this number&apos;s &ldquo;A message comes in&rdquo; webhook at{" "}
          <code className="font-mono">{`{APP_BASE_URL}/api/sms/inbound`}</code>{" "}
          in the Twilio console.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="tel"
            value={twilioPhone}
            onChange={(e) => setTwilioPhoneState(e.target.value)}
            placeholder="+14155551234"
            className="flex-1 rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
          <button
            type="button"
            onClick={onSaveTwilioPhone}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Save number
          </button>
        </div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Or have us provision one for you
          </p>
          <p className="mt-1 text-sm text-slate-600">
            We&apos;ll search Twilio for an SMS-capable number, buy it on the
            platform&apos;s account, and wire its inbound webhook
            automatically. Costs about $1.15/month — billed through your
            Invoice Chase subscription.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              inputMode="numeric"
              maxLength={3}
              value={areaCode}
              onChange={(e) =>
                setAreaCode(e.target.value.replace(/\D/g, ""))
              }
              placeholder="Area code (e.g. 415)"
              className="rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:w-48"
            />
            <button
              type="button"
              onClick={onProvisionTwilio}
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Provision number
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Production sending in the US still requires A2P 10DLC registration
            in your Twilio account first.
          </p>
        </div>

        {twilioError ? (
          <p className="mt-2 text-xs text-red-700">{twilioError}</p>
        ) : null}
        {savedTag === "twilio-phone" ? (
          <p className="mt-2 text-xs text-emerald-700">Saved</p>
        ) : null}
      </section>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-emerald-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
