import type { CSSProperties } from "react";

type Props = {
  className?: string;
  style?: CSSProperties;
  /** Render N stacked skeleton lines instead of a single block. */
  lines?: number;
};

export function Skeleton({ className = "h-4 w-full", style, lines }: Props) {
  if (lines && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`animate-pulse rounded bg-stone-200/70 ${
              i === lines - 1 ? "h-4 w-2/3" : "h-4 w-full"
            }`}
          />
        ))}
      </div>
    );
  }
  return (
    <div
      className={`animate-pulse rounded bg-stone-200/70 ${className}`}
      style={style}
      aria-hidden
    />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4 last:border-b-0">
      <div className="flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-2 h-3 w-1/5" />
      </div>
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-7 w-20 rounded-md" />
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 ${className}`}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-1/2" />
      <Skeleton className="mt-2 h-3 w-2/3" />
    </div>
  );
}
