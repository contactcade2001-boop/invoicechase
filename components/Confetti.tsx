"use client";

import { useEffect, useState } from "react";

type Piece = {
  id: number;
  left: string;
  delay: string;
  x: string;
  color: string;
};

const COLORS = [
  "#f97316", // orange-500
  "#fb923c", // orange-400
  "#fbbf24", // amber-400
  "#10b981", // emerald-500
  "#f43f5e", // rose-500
  "#1c1917", // ink
];

function newPieces(count = 60): Piece[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 200}ms`,
    x: `${(Math.random() - 0.5) * 200}px`,
    color: COLORS[i % COLORS.length],
  }));
}

/**
 * Burst of confetti pieces that fall from the top of the viewport. Mount the
 * component conditionally (e.g. when `payment.status === "succeeded"`); it
 * removes itself after the animation completes.
 */
export function Confetti({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const p = newPieces(60);
    setPieces(p);
    const t = setTimeout(() => setPieces([]), 1800);
    return () => clearTimeout(t);
  }, [trigger]);

  if (pieces.length === 0) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: p.left,
              backgroundColor: p.color,
              "--x": p.x,
              "--delay": p.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
