/**
 * Stripe-style background: flat white with a barely-there warm tint at the
 * top edge. No motion, no grid, no blobs. Lets cards float on clean white.
 */
export function AppBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white"
    >
      {/* Whisper of warmth at the very top — visible only over white. */}
      <div
        className="absolute inset-x-0 top-0 h-[360px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,237,213,0.35) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
