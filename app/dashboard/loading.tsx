import { Skeleton, SkeletonCard, SkeletonRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 lg:px-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 lg:px-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <Skeleton className="h-3 w-32" />
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-8 w-32" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <div className="flex gap-6">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton lines={3} />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
