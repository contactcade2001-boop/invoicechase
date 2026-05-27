"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Palette,
  Sparkles,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import {
  HousecallProLogo,
  JobberLogo,
  QuickBooksLogo,
  ServiceTitanLogo,
  XeroLogo,
} from "@/components/BrandLogos";

const STEPS = ["Business", "Brand", "Integration"] as const;

const INDUSTRIES = [
  "Plumbing",
  "HVAC",
  "Electrical",
  "Roofing",
  "Cleaning",
  "Landscaping",
  "Auto repair",
  "Pest control",
  "General contracting",
  "Other",
];

const ACCENT_SWATCHES = [
  "#f97316", // orange
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#a855f7", // purple
  "#ef4444", // red
  "#0f172a", // slate
];

const INTEGRATIONS = [
  { id: "qbo", Logo: QuickBooksLogo, name: "QuickBooks Online", popular: true },
  { id: "xero", Logo: XeroLogo, name: "Xero" },
  { id: "jobber", Logo: JobberLogo, name: "Jobber" },
  { id: "hcp", Logo: HousecallProLogo, name: "Housecall Pro" },
  { id: "st", Logo: ServiceTitanLogo, name: "ServiceTitan" },
  { id: "later", Logo: null, name: "I'll decide later" },
];

type Props = {
  initialBusinessName: string;
  initialIndustry: string;
  initialAccentColor: string;
  initialIntegration: string;
};

export function OnboardingWizard({
  initialBusinessName,
  initialIndustry,
  initialAccentColor,
  initialIntegration,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [industry, setIndustry] = useState(initialIndustry);
  const [accentColor, setAccentColor] = useState(initialAccentColor);
  const [integration, setIntegration] = useState(initialIntegration);
  const [pending, startTransition] = useTransition();

  function canAdvance(): boolean {
    if (step === 0) return businessName.trim().length > 0 && industry !== "";
    if (step === 1) return !!accentColor;
    if (step === 2) return !!integration;
    return false;
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      void persist();
    } else {
      finish();
    }
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  async function persist(completed = false) {
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName,
        industry,
        accentColor,
        preferredIntegration: integration,
        completed,
      }),
    });
  }

  function finish() {
    startTransition(async () => {
      await persist(true);
      // Send the user to the integration connect flow if they picked one.
      if (integration === "qbo") router.push("/api/qbo/connect");
      else if (integration === "xero") router.push("/api/xero/connect");
      else if (integration === "jobber") router.push("/api/jobber/connect");
      else if (integration === "hcp") router.push("/api/housecallpro/connect");
      else if (integration === "st") router.push("/api/servicetitan/connect");
      else router.push("/dashboard");
    });
  }

  return (
    <div className="bg-hero-mesh flex min-h-screen flex-col">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5 lg:px-6">
          <div className="flex items-center gap-2">
            <BrandMark size={18} />
            <span className="font-display text-sm font-bold tracking-tight text-stone-900">
              Welcome to Invoice Chase<span className="text-orange-600">.</span>
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-10 lg:px-6">
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  i < step
                    ? "bg-orange-600 text-white"
                    : i === step
                      ? "bg-stone-900 text-white"
                      : "bg-stone-200 text-stone-500"
                }`}
              >
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={`hidden text-xs font-semibold uppercase tracking-wider sm:inline ${
                  i === step ? "text-stone-900" : "text-stone-400"
                }`}
              >
                {s}
              </span>
              {i < STEPS.length - 1 ? (
                <span
                  className={`h-px flex-1 ${
                    i < step ? "bg-orange-300" : "bg-stone-200"
                  }`}
                />
              ) : null}
            </div>
          ))}
        </div>

        <section className="mt-10 rounded-2xl bg-white p-8 shadow-xl shadow-stone-900/5 ring-1 ring-stone-200">
          {step === 0 ? (
            <>
              <Building2 className="h-6 w-6 text-orange-600" aria-hidden />
              <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-stone-900">
                Tell us about your business.
              </h1>
              <p className="mt-2 text-sm text-stone-600">
                Used to personalize reminders and your customer portal.
              </p>
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold text-stone-700">
                    Business name
                  </span>
                  <input
                    type="text"
                    autoFocus
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Honest Plumbing"
                    className="mt-1.5 block w-full rounded-md border-0 px-3 py-2.5 text-stone-900 shadow-sm ring-1 ring-inset ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-stone-900"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-stone-700">
                    Industry
                  </span>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="mt-1.5 block w-full rounded-md border-0 bg-white px-3 py-2.5 text-stone-900 shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-stone-900"
                  >
                    <option value="">Choose one…</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          ) : step === 1 ? (
            <>
              <Palette className="h-6 w-6 text-orange-600" aria-hidden />
              <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-stone-900">
                Pick your brand color.
              </h1>
              <p className="mt-2 text-sm text-stone-600">
                Shows up on your customer portal, pay-now buttons, and
                receipts.
              </p>
              <div className="mt-6 grid grid-cols-6 gap-3">
                {ACCENT_SWATCHES.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setAccentColor(c)}
                    className={`relative h-14 rounded-xl shadow-sm transition hover:scale-105 ${accentColor === c ? "ring-4 ring-stone-900 ring-offset-2" : ""}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Pick ${c}`}
                  >
                    {accentColor === c ? (
                      <CheckCircle2 className="absolute inset-0 m-auto h-5 w-5 text-white" />
                    ) : null}
                  </button>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3 text-xs text-stone-500">
                <span>Or pick a custom hex:</span>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-8 w-12 rounded border-0 bg-transparent"
                />
                <code className="font-mono text-stone-700">{accentColor}</code>
              </div>
              <div
                className="mt-6 overflow-hidden rounded-2xl border border-stone-200 p-5"
                style={{
                  background: `linear-gradient(180deg, ${accentColor}10 0%, transparent 100%)`,
                }}
              >
                <p className="text-xs uppercase tracking-wider text-stone-500">
                  Preview
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-stone-900">
                  {businessName || "Your Business"} · Pay invoice
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: accentColor }}
                  disabled
                >
                  Pay $1,240 now
                </button>
              </div>
            </>
          ) : (
            <>
              <Sparkles className="h-6 w-6 text-orange-600" aria-hidden />
              <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-stone-900">
                Where do your invoices live?
              </h1>
              <p className="mt-2 text-sm text-stone-600">
                We&apos;ll OAuth in 60 seconds and pull your customers +
                balances automatically.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {INTEGRATIONS.map((it) => {
                  const active = integration === it.id;
                  return (
                    <button
                      type="button"
                      key={it.id}
                      onClick={() => setIntegration(it.id)}
                      className={`group flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-orange-600 bg-orange-50 ring-2 ring-orange-200"
                          : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
                      }`}
                    >
                      {it.Logo ? (
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-50 ring-1 ring-stone-200">
                          <it.Logo size={20} />
                        </span>
                      ) : (
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs font-bold text-stone-500 ring-1 ring-stone-200">
                          ?
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-stone-900">
                          {it.name}
                        </p>
                        {it.popular ? (
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700">
                            Most popular
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-stone-100 pt-6">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance() || pending}
              className="group inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {step === STEPS.length - 1 ? "Finish" : "Continue"}
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
