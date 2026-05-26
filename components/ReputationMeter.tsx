import { REPUTATION_MAX, REPUTATION_MIN } from "@/lib/types";

type Tier = {
  min: number;
  max: number;
  label: string;
  dot: string;
  pill: string;
};

const TIERS: Tier[] = [
  {
    min: 300,
    max: 579,
    label: "Poor",
    dot: "bg-red-500",
    pill: "bg-red-50 text-red-700 ring-red-200",
  },
  {
    min: 580,
    max: 669,
    label: "Fair",
    dot: "bg-orange-500",
    pill: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  {
    min: 670,
    max: 739,
    label: "Good",
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  {
    min: 740,
    max: 799,
    label: "Strong",
    dot: "bg-lime-500",
    pill: "bg-lime-50 text-lime-700 ring-lime-200",
  },
  {
    min: 800,
    max: 850,
    label: "Excellent",
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
];

function tierFor(score: number): Tier {
  return TIERS.find((t) => score >= t.min && score <= t.max) ?? TIERS[0];
}

export function ReputationMeter({ score }: { score: number }) {
  const clamped = Math.max(REPUTATION_MIN, Math.min(REPUTATION_MAX, score));
  const tier = tierFor(clamped);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tier.pill}`}
      title={`Reputation ${clamped} of ${REPUTATION_MAX}. Visible only to you.`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tier.dot}`} aria-hidden />
      {tier.label}
      <span className="tabular-nums text-slate-500">·</span>
      <span className="tabular-nums text-slate-600">{clamped}</span>
    </span>
  );
}
