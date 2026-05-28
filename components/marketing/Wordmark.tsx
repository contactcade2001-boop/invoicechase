/**
 * Marketing wordmark — original design. A solid stroke "IC" monogram
 * built from two angled rules, paired with the full name. Kept as one
 * inline SVG so it ships with no extra request and scales crisply.
 */
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="text-mk-primary-500"
      >
        {/* Two ascending bars + a leading vertical, suggesting upward
            collection cadence without being literal. */}
        <rect x="4" y="6" width="2.6" height="14" rx="1" fill="currentColor" />
        <rect
          x="10"
          y="11"
          width="2.6"
          height="9"
          rx="1"
          fill="currentColor"
          opacity="0.75"
        />
        <rect
          x="16"
          y="7"
          width="2.6"
          height="13"
          rx="1"
          fill="currentColor"
          opacity="0.55"
        />
      </svg>
      <span className="mk-display text-[15px] font-bold leading-none text-mk-ink-950">
        Invoice Chase
        <span className="text-mk-primary-500">.</span>
      </span>
    </span>
  );
}
