"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Cursor-following spotlight overlay. Wrap any section to get a soft
 * orange glow that tracks the mouse on that section only. Sets CSS vars
 * --x / --y on the wrapper so the radial-gradient updates with no
 * re-render. Pointer events pass through to children.
 */
export function Spotlight({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el!.style.setProperty("--x", `${x}%`);
      el!.style.setProperty("--y", `${y}%`);
    }
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        aria-hidden
        className="spotlight pointer-events-none absolute inset-0"
      />
      {children}
    </div>
  );
}
