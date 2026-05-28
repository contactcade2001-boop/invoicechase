/**
 * Loading skeleton that mirrors the dashboard layout — the user sees
 * the same shape they're about to read, so the page never jumps.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-mk-ink-50">
      <div className="h-14 border-b border-mk-ink-300/60 bg-mk-surface" />
      <main className="mx-auto w-full max-w-[1120px] px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
          <div className="lg:col-span-2">
            <SkeletonHero />
          </div>
          <div className="space-y-5">
            <SkeletonCard rows={4} />
            <SkeletonCard rows={3} />
          </div>
          <div className="space-y-5">
            <SkeletonChart />
          </div>
        </div>
      </main>
    </div>
  );
}

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-mk-sm bg-mk-ink-100 ${className}`}
      aria-hidden
    />
  );
}

function SkeletonHero() {
  return (
    <div className="rounded-mk-xl bg-mk-surface p-8 shadow-mk-1 ring-1 ring-mk-ink-300/60">
      <Shimmer className="h-3 w-32" />
      <Shimmer className="mt-6 h-12 w-72" />
      <Shimmer className="mt-3 h-3 w-40" />
      <div className="my-7 h-px bg-mk-ink-300/60" />
      <Shimmer className="h-8 w-56" />
      <Shimmer className="mt-3 h-3 w-44" />
    </div>
  );
}

function SkeletonCard({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-mk-xl bg-mk-surface shadow-mk-1 ring-1 ring-mk-ink-300/60">
      <div className="border-b border-mk-ink-300/60 p-6">
        <Shimmer className="h-4 w-28" />
        <Shimmer className="mt-2 h-3 w-48" />
      </div>
      <ul className="divide-y divide-mk-ink-300/60">
        {Array.from({ length: rows }).map((_, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-4 px-6 py-4"
          >
            <div className="min-w-0 flex-1">
              <Shimmer className="h-4 w-1/2" />
              <Shimmer className="mt-2 h-3 w-1/3" />
            </div>
            <Shimmer className="h-9 w-20" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-mk-xl bg-mk-surface p-6 shadow-mk-1 ring-1 ring-mk-ink-300/60">
      <Shimmer className="h-4 w-32" />
      <Shimmer className="mt-2 h-3 w-44" />
      <div className="mt-5 flex h-[160px] items-end gap-[2px]">
        {Array.from({ length: 30 }).map((_, i) => (
          <Shimmer
            key={i}
            className="flex-1"
            // Pseudo-random heights so it reads as a chart, not bars.
            // Deterministic to avoid hydration churn.
            // eslint-disable-next-line react/forbid-component-props
            {...{ style: { height: `${20 + ((i * 37) % 110)}px` } }}
          />
        ))}
      </div>
    </div>
  );
}
