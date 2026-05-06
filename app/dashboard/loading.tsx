import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-4 h-12 w-64" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-12 w-72 rounded-lg" />
        </div>
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <Skeleton className="h-10 w-full rounded-t-2xl" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="border-t border-slate-100 px-6 py-4"
            >
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="mt-2 h-3 w-1/4" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
