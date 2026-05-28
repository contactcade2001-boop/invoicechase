/**
 * Stripe-style animated hero mesh. Three colored blobs drift slowly behind
 * the hero with `mix-blend-mode: multiply` so they blend into a soft
 * shifting wash. Pure CSS — no JS overhead.
 */
export function HeroMesh() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="mesh-a absolute -left-32 -top-32 h-[40rem] w-[40rem] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(249,115,22,0.55) 0%, rgba(249,115,22,0) 70%)",
        }}
      />
      <div
        className="mesh-b absolute -right-32 top-12 h-[44rem] w-[44rem] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(244,63,94,0.45) 0%, rgba(244,63,94,0) 70%)",
        }}
      />
      <div
        className="mesh-c absolute left-1/3 -bottom-32 h-[36rem] w-[36rem] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.40) 0%, rgba(168,85,247,0) 70%)",
        }}
      />
    </div>
  );
}
