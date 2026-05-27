"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Target end value. */
  to: number;
  /** Animation duration in ms. */
  duration?: number;
  /** Number of digits after the decimal point. */
  decimals?: number;
  /** Optional locale formatter (e.g. "en-US"). */
  locale?: string;
  /** Optional prefix like "$". */
  prefix?: string;
  /** Optional suffix like "+". */
  suffix?: string;
  className?: string;
};

/**
 * Counts from 0 → `to` once the element scrolls into view. Uses an
 * IntersectionObserver so it only fires when visible.
 */
export function AnimatedCounter({
  to,
  duration = 1800,
  decimals = 0,
  locale = "en-US",
  prefix = "",
  suffix = "",
  className,
}: Props) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const step = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              // ease-out cubic
              const eased = 1 - Math.pow(1 - t, 3);
              setValue(to * eased);
              if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);

  const formatted = value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/**
 * Live "$X collected" counter that ticks up from a seed every few seconds —
 * gives the homepage a heartbeat. Pure visual; not tied to real data.
 */
export function LiveCounter({
  seed,
  perSecond,
  className,
}: {
  seed: number;
  perSecond: number;
  className?: string;
}) {
  const [value, setValue] = useState(seed);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const start = performance.now();
    const id = setInterval(() => {
      if (!mounted.current) return;
      const elapsed = (performance.now() - start) / 1000;
      setValue(seed + Math.round(elapsed * perSecond));
    }, 800);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [seed, perSecond]);

  return (
    <span className={className}>
      ${value.toLocaleString("en-US")}
    </span>
  );
}
