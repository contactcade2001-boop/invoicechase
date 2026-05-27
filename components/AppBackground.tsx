/**
 * Static dark background — single subtle radial highlight, no motion, no
 * blobs. Reads like Linear/Ramp: dark surface with hint of depth.
 */
export function AppBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-stone-950"
    >
      {/* Soft top-right glow for depth — single layer, no animation. */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(1200px 600px at 80% -10%, rgba(249,115,22,0.12) 0%, transparent 60%), radial-gradient(900px 500px at 0% 110%, rgba(120,113,108,0.10) 0%, transparent 60%)",
        }}
      />
      {/* Hairline grid for that enterprise SaaS feel. */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
