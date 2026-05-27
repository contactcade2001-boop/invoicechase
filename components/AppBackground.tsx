/**
 * Three slow-drifting orange blobs that sit behind every authenticated page.
 * Server component — pure CSS, no JS. Fixed-position, ignores pointer events.
 */
export function AppBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Base wash so the blobs don't sit on harsh white. */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-white to-stone-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950" />
      <div
        className="aurora-blob-a absolute -left-32 -top-40 h-[36rem] w-[36rem] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0) 70%)",
        }}
      />
      <div
        className="aurora-blob-b absolute right-[-10rem] top-[10rem] h-[40rem] w-[40rem] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0) 70%)",
        }}
      />
      <div
        className="aurora-blob-c absolute left-[20%] bottom-[-12rem] h-[32rem] w-[32rem] rounded-full opacity-35 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(244,63,94,0.14) 0%, rgba(244,63,94,0) 70%)",
        }}
      />
    </div>
  );
}
