import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-stone-800 bg-stone-900/70">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
        <Skeleton className="h-4 w-40" />
        <div className="mt-6 rounded-2xl bg-stone-900/70 p-8 shadow-sm ring-1 ring-stone-800">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="mt-4 h-3 w-32" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-stone-950 p-4 ring-1 ring-stone-800"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-7 w-32" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 rounded-2xl bg-stone-900/70 shadow-sm ring-1 ring-stone-800">
          <Skeleton className="h-10 w-full rounded-t-2xl" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-t border-stone-800/60 px-4 py-3"
            >
              <Skeleton className="h-5 w-3/4" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
