import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-14 border-b border-stone-200 bg-white" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 lg:px-6">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <Skeleton className="h-4 w-40" />
          <div className="mt-6 grid grid-cols-13 gap-1">
            {Array.from({ length: 13 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-24 w-full rounded"
                style={{ height: `${30 + (i % 6) * 12}px` }}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
