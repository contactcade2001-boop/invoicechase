import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-14 border-b border-stone-800 bg-stone-900/70" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 lg:px-6">
        <Skeleton className="h-7 w-24" />
        <div className="overflow-hidden rounded-2xl bg-stone-900/70 shadow-sm ring-1 ring-stone-800">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 border-b border-stone-800/60 px-5 py-4 last:border-b-0"
            >
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="mt-2 h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
