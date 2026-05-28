import type { TrendPoint } from "@/lib/dashboard/types";

function fmtUsd(cents: number, compact = true): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  });
}

/**
 * Pure-SVG bar chart of daily collections. No client JS, no chart
 * library — three primitives (g/rect/line) and that's it. Title +
 * total + min/max ticks frame the chart so it's still readable
 * without hover state.
 */
export function TrendChart({ data }: { data: TrendPoint[] }) {
  const total = data.reduce((s, d) => s + d.totalCents, 0);
  const max = Math.max(1, ...data.map((d) => d.totalCents));
  const W = 600;
  const H = 160;
  const PAD_TOP = 8;
  const PAD_BOTTOM = 14;
  const usable = H - PAD_TOP - PAD_BOTTOM;
  const barGap = 2;
  const barW = (W - (data.length - 1) * barGap) / data.length;

  return (
    <section
      aria-label="Collections over the last 30 days"
      className="rounded-mk-xl bg-mk-surface p-6 shadow-mk-1 ring-1 ring-mk-ink-300/60"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="mk-display text-[18px] font-semibold text-mk-ink-950">
          Last 30 days
        </h2>
        <p className="font-mono text-[14px] font-semibold tabular-nums text-mk-ink-950">
          {fmtUsd(total, false)}{" "}
          <span className="text-[12px] font-normal text-mk-ink-500">
            collected
          </span>
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Bar chart showing daily collections totalling ${fmtUsd(total, false)} over the last 30 days`}
        className="mt-5 h-[160px] w-full"
        preserveAspectRatio="none"
      >
        {/* Hairline baseline */}
        <line
          x1="0"
          x2={W}
          y1={H - PAD_BOTTOM + 0.5}
          y2={H - PAD_BOTTOM + 0.5}
          stroke="currentColor"
          className="text-mk-ink-300"
          strokeWidth="1"
        />
        {data.map((d, i) => {
          const ratio = d.totalCents / max;
          const h = Math.max(2, Math.round(ratio * usable));
          const x = i * (barW + barGap);
          const y = H - PAD_BOTTOM - h;
          return (
            <g key={d.dateIso}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={2}
                className="fill-mk-primary-500"
              >
                <title>
                  {d.dateIso}: {fmtUsd(d.totalCents, false)}
                </title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-mk-ink-500">
        <span>{shortDate(data[0]?.dateIso)}</span>
        <span>{shortDate(data[data.length - 1]?.dateIso)}</span>
      </div>
    </section>
  );
}

function shortDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
