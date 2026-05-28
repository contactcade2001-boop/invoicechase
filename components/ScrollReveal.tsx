"use client";

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Delay before the reveal starts, in ms. Stack on neighbor elements. */
  delay?: number;
  /** Render as a different element. Useful when the wrapper needs to be
   *  a list item / section so it participates in the parent's layout. */
  as?: ElementType;
};

/**
 * Reveal-on-scroll wrapper. Items start hidden + 20px below; once they
 * scroll into view (20% threshold), the CSS transition fades + slides
 * them into place. Uses a single IntersectionObserver per node and
 * disconnects after firing.
 *
 * Hidden state is gated on `html.js` in globals.css so users without
 * JS — or any flash between SSR and hydration — see content visibly.
 */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
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
    <Tag
      ref={ref}
      className={`${shown ? "reveal-in" : "reveal-init"} ${className}`}
    >
      {children}
    </Tag>
  );
}
