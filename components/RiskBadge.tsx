import type { RiskTier } from "@/lib/types";

const styles: Record<RiskTier, { dot: string; pill: string; label: string }> = {
  low: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    label: "Low risk",
  },
  medium: {
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700 ring-amber-200",
    label: "Medium risk",
  },
  high: {
    dot: "bg-red-500",
    pill: "bg-red-50 text-red-700 ring-red-200",
    label: "High risk",
  },
};

export function RiskBadge({ tier }: { tier: RiskTier }) {
  const s = styles[tier];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  );
}
