import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export type OnboardingStep = {
  key: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  done: boolean;
  /**
   * Optional inline element — a row of brand logos, a single brand mark,
   * an icon, etc. Renders between the title and the body when set.
   */
  badge?: ReactNode;
};

export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const remaining = steps.filter((s) => !s.done);
  if (remaining.length === 0) return null;
  const next = remaining[0];

  return (
    <div className="rounded-2xl bg-stone-900/70 p-6 shadow-sm ring-1 ring-emerald-200 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          Finish setting up Invoice Chase
        </h2>
        <span className="text-xs font-semibold text-emerald-700">
          {steps.length - remaining.length} of {steps.length} done
        </span>
      </div>
      <p className="mt-1 text-sm text-stone-400">
        A few more steps and you&apos;re ready to collect.
      </p>
      <ol className="mt-5 space-y-3">
        {steps.map((step, i) => {
          const isNext = step.key === next.key;
          return (
            <li
              key={step.key}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                step.done
                  ? "border-emerald-100 bg-emerald-50/50"
                  : isNext
                    ? "border-slate-300 bg-stone-950"
                    : "border-stone-800 bg-stone-900/70"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.done
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-stone-300"
                }`}
              >
                {step.done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm font-semibold ${
                    step.done ? "text-stone-500 line-through" : "text-stone-100"
                  }`}
                >
                  {step.title}
                </div>
                {step.badge && !step.done ? (
                  <div className="mt-1.5">{step.badge}</div>
                ) : null}
                <p
                  className={`mt-0.5 text-xs ${
                    step.done ? "text-stone-500" : "text-stone-400"
                  }`}
                >
                  {step.body}
                </p>
              </div>
              {!step.done && isNext ? (
                <Link
                  href={step.href}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  {step.cta}
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
