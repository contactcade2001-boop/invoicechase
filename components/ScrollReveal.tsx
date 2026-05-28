"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Delay before the reveal starts, in ms. Stack on neighbor elements. */
  delay?: number;
};

/**
 * Reveal-on-scroll wrapper. Items start hidden + 20px below; once they
 * scroll into view (40% threshold), the CSS transition fades + slides
 * them into place. Uses a single IntersectionObserver per node.
 */
export function ScrollReveal({ children, className = "", delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (shown) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setTimeout(() => setShown(true), delay);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, shown]);

  return (
    <div
      ref={ref}
      className={`${shown ? "reveal-in" : "reveal-init"} ${className}`}
    >
      {children}
    </div>
  );
}
