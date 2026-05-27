import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-14 border-b border-stone-800 bg-stone-900/70" />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 lg:px-6">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
