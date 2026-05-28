import { Activity } from "lucide-react";
import type { PulseResult } from "@/lib/server/insights/pulse";

const GRADE_COLOR: Record<PulseResult["grade"], { text: string; ring: string; bg: string }> = {
  A: { text: "text-emerald-700", ring: "ring-emerald-200", bg: "from-emerald-500/15 to-emerald-500/0" },
  B: { text: "text-lime-700", ring: "ring-lime-200", bg: "from-lime-500/15 to-lime-500/0" },
  C: { text: "text-amber-700", ring: "ring-amber-200", bg: "from-amber-500/15 to-amber-500/0" },
  D: { text: "text-orange-700", ring: "ring-orange-200", bg: "from-orange-500/15 to-orange-500/0" },
  F: { text: "text-red-700", ring: "ring-red-200", bg: "from-red-500/15 to-red-500/0" },
};

function MiniBar({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  const color =
    value >= 80
      ? "bg-emerald-500"
      : value >= 60
        ? "bg-lime-500"
        : value >= 40
          ? "bg-amber-500"
          : value >= 20
            ? "bg-orange-500"
            : "bg-red-500";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-stone-600">{label}</p>
        <p className="text-[11px] tabular-nums text-stone-500">{detail}</p>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function PulseScoreCard({ pulse }: { pulse: PulseResult }) {
  const c = GRADE_COLOR[pulse.grade];
  return (
    <section
      className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200`}
    >
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${c.bg}`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Activity className="h-3 w-3" aria-hidden /> AR Pulse
          </p>
          <p className="mt-3 text-sm text-stone-600">{pulse.headline}</p>
        </div>
        <div
          className={`flex flex-col items-center rounded-2xl bg-white px-4 py-3 ring-1 ${c.ring}`}
        >
          <p className={`text-4xl font-bold tabular-nums ${c.text}`}>
            {pulse.score}
          </p>
          <p className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>
            Grade {pulse.grade}
          </p>
        </div>
      </div>
      <div className="relative mt-6 grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
        <MiniBar
          label="DSO"
          value={pulse.breakdown.dsoScore}
          detail={`${pulse.inputs.dso} days`}
        />
        <MiniBar
          label="Overdue rate"
          value={pulse.breakdown.overdueScore}
          detail={`${pulse.inputs.overduePct}%`}
        />
        <MiniBar
          label="Concentration"
          value={pulse.breakdown.concentrationScore}
          detail={`Top 3 = ${Math.round(pulse.inputs.top3Concentration * 100)}%`}
        />
        <MiniBar
          label="Avg reputation"
          value={pulse.breakdown.reputationScore}
          detail={`${pulse.inputs.avgReputation}/850`}
        />
      </div>
    </section>
  );
}
