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
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 sm:py-10">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-9 w-32" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <Skeleton className="h-10 w-full rounded-t-2xl" />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="border-t border-slate-100 px-4 py-3"
            >
              <Skeleton className="h-5 w-1/2" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
