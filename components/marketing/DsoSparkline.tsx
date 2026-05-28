"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tiny SVG sparkline that draws itself in via stroke-dasharray when
 * scrolled into view. Hover tooltips are native <title>s — no JS for
 * the tooltip itself.
 *
 * Pure SVG, no chart library, no client deps except a one-shot
 * IntersectionObserver to flip the `is-visible` class so the
 * keyframe runs. Falls back to "always visible" when reduced motion
 * is on (via the CSS rule).
 */

type Point = { weekLabel: string; dso: number };

const DEFAULT_DATA: Point[] = [
  { weekLabel: "Week 1", dso: 47 },
  { weekLabel: "Week 2", dso: 42 },
  { weekLabel: "Week 3", dso: 36 },
  { weekLabel: "Week 4", dso: 29 },
  { weekLabel: "Week 5", dso: 23 },
  { weekLabel: "Week 6", dso: 19 },
];

const W = 220;
const H = 60;
const PAD_X = 8;
const PAD_Y = 8;

export function DsoSparkline({
  data = DEFAULT_DATA,
}: {
  data?: Point[];
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [shown]);

  const max = Math.max(...data.map((p) => p.dso));
  const min = Math.min(...data.map((p) => p.dso));
  const span = Math.max(1, max - min);
  const usableW = W - PAD_X * 2;
  const usableH = H - PAD_Y * 2;
  const xs = data.map((_, i) => PAD_X + (i / (data.length - 1)) * usableW);
  const ys = data.map(
    (p) => PAD_Y + ((max - p.dso) / span) * usableH,
  );
  const linePath = xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${ys[i].toFixed(2)}`)
    .join(" ");

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label={`DSO trend over six weeks, from ${data[0].dso} days to ${data[data.length - 1].dso} days`}
      className="block"
    >
      {/* Baseline hairline */}
      <line
        x1={0}
        x2={W}
        y1={H - 0.5}
        y2={H - 0.5}
        stroke="currentColor"
        className="text-mk-ink-300"
        strokeWidth="1"
      />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`text-mk-primary-500 mk-spark-line ${shown ? "is-visible" : ""}`}
      />
      {data.map((p, i) => (
        <circle
          key={p.weekLabel}
          cx={xs[i]}
          cy={ys[i]}
          r="2.5"
          fill="currentColor"
          className="text-mk-primary-600 mk-spark-dot"
          style={{ transformOrigin: `${xs[i]}px ${ys[i]}px` }}
        >
          <title>
            {p.weekLabel}: {p.dso} days
          </title>
        </circle>
      ))}
    </svg>
  );
}
