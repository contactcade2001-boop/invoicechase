import { Lock } from "lucide-react";
import { REPUTATION_MAX, REPUTATION_MIN } from "@/lib/types";

type Tier = {
  min: number;
  max: number;
  label: string;
  bar: string;
  text: string;
};

const TIERS: Tier[] = [
  { min: 300, max: 579, label: "Poor", bar: "bg-red-500", text: "text-red-700" },
  { min: 580, max: 669, label: "Fair", bar: "bg-orange-500", text: "text-orange-700" },
  { min: 670, max: 739, label: "Good", bar: "bg-amber-500", text: "text-amber-700" },
  { min: 740, max: 799, label: "Very Good", bar: "bg-lime-500", text: "text-lime-700" },
  { min: 800, max: 850, label: "Exceptional", bar: "bg-emerald-500", text: "text-emerald-700" },
];

const TOTAL_RANGE = REPUTATION_MAX - REPUTATION_MIN;

function tierFor(score: number): Tier {
  return TIERS.find((t) => score >= t.min && score <= t.max) ?? TIERS[0];
}

export function ReputationMeter({ score }: { score: number }) {
  const clamped = Math.max(REPUTATION_MIN, Math.min(REPUTATION_MAX, score));
  const pct = ((clamped - REPUTATION_MIN) / TOTAL_RANGE) * 100;
  const tier = tierFor(clamped);

  return (
    <div
      className="inline-flex items-center gap-2"
      title={`Reputation score ${REPUTATION_MIN}–${REPUTATION_MAX}. Predicts on-time payment likelihood. Visible only to you.`}
    >
      <div className="relative w-24 shrink-0 pt-2">
        <div className="flex h-1.5 overflow-hidden rounded-full ring-1 ring-inset ring-slate-200">
          {TIERS.map((t) => (
            <div
              key={t.min}
              className={t.bar}
              style={{
                width: `${((t.max - t.min + 1) / TOTAL_RANGE) * 100}%`,
              }}
            />
          ))}
        </div>
        <div
          className="absolute -top-0.5 h-3 w-0.5 rounded-full bg-slate-900 ring-2 ring-white"
          style={{ left: `calc(${pct}% - 1px)` }}
          aria-hidden
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`text-sm font-bold tabular-nums ${tier.text}`}>
          {clamped}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {tier.label}
          <Lock className="h-2.5 w-2.5" aria-label="Visible only to you" />
        </span>
      </div>
    </div>
  );
}
