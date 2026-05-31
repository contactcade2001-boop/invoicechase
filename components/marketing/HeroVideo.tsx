"use client";

import { useEffect, useRef } from "react";

/**
 * Product hero video — an original, generated loop of the InvoiceChase AR
 * dashboard (counter ramping, DSO ticking 41→19, a risk badge updating, an
 * invoice flipping OVERDUE→PAID, a Fast-Pay SMS landing). Assets live in
 * /public/hero and are produced by scripts/gen_hero_video.py.
 *
 * Delivery:
 *  - <source media> serves the 640×360 files on phones and the 1280×720 files
 *    on larger screens (mobile WebM ≈ 309KB vs desktop WebM ≈ 694KB).
 *  - WebM (VP9) first, MP4 (H.264) fallback for Safari/older browsers.
 *  - Muted + loop + playsInline so it can autoplay inline on mobile.
 *
 * Motion / a11y:
 *  - We start playback from an effect (play()) instead of the autoplay
 *    attribute. That lets us honor prefers-reduced-motion: those users keep
 *    the static poster (the "after" beat) and never see motion. It also means
 *    the poster is the graceful fallback if JS is unavailable.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return; // keep the poster; no motion
    // muted + playsInline make this resolve without a user gesture.
    void video.play().catch(() => {
      /* autoplay blocked — poster stays, which is fine */
    });
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      {/* Soft halo behind the window for depth — matches the site's hero glow. */}
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-mk-primary-100 via-mk-primary-50 to-transparent blur-2xl"
      />
      <div className="overflow-hidden rounded-mk-xl bg-mk-ink-950 p-2 shadow-mk-3 ring-1 ring-mk-ink-950/10">
        {/* Faux app title bar */}
        <div className="flex items-center gap-1.5 px-3 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="ml-3 font-mono text-[10px] text-white/40">
            app.invoicechase.com/dashboard
          </span>
        </div>
        <video
          ref={ref}
          className="block aspect-video w-full rounded-mk-lg bg-mk-ink-950"
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero/hero-poster.jpg"
          aria-label="InvoiceChase dashboard: an overdue invoice being collected and marked paid."
        >
          {/* Phones: smaller, lighter files. */}
          <source
            src="/hero/hero-mobile.webm"
            type="video/webm"
            media="(max-width: 767px)"
          />
          <source
            src="/hero/hero-mobile.mp4"
            type="video/mp4"
            media="(max-width: 767px)"
          />
          {/* Tablet/desktop. */}
          <source src="/hero/hero-desktop.webm" type="video/webm" />
          <source src="/hero/hero-desktop.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
