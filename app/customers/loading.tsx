import { Skeleton, SkeletonRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-14 border-b border-stone-800 bg-stone-900/70" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-72 rounded-md" />
        </div>
        <div className="overflow-hidden rounded-2xl bg-stone-900/70 shadow-sm ring-1 ring-stone-800">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
