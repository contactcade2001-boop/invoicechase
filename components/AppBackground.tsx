/**
 * Slow-drifting orange/amber/rose blobs that sit behind every page.
 * Pure CSS, no JS, GPU-accelerated. Fixed-position, ignores pointer events.
 */
export function AppBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Base wash. */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-white to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950" />
      <div
        className="aurora-blob-a absolute -left-32 -top-40 h-[42rem] w-[42rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(249,115,22,0.42) 0%, rgba(249,115,22,0) 70%)",
        }}
      />
      <div
        className="aurora-blob-b absolute -right-32 top-[6rem] h-[48rem] w-[48rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.40) 0%, rgba(245,158,11,0) 70%)",
        }}
      />
      <div
        className="aurora-blob-c absolute left-[15%] -bottom-64 h-[40rem] w-[40rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(244,63,94,0.34) 0%, rgba(244,63,94,0) 70%)",
        }}
      />
      <div
        className="aurora-blob-a absolute right-[20%] bottom-[8%] h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.30) 0%, rgba(251,191,36,0) 70%)",
          animationDelay: "-8s",
        }}
      />
    </div>
  );
}
