import type { CSSProperties } from "react";

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 ${className}`}
      style={style}
      aria-hidden
    />
  );
}
