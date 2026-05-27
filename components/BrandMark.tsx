type Props = {
  size?: number;
  className?: string;
  withWordmark?: boolean;
};

/**
 * Clean ascending-chart mark. No gradients (they pixelate at small sizes),
 * single orange stroke, generous stroke caps — reads at 16px or 96px.
 */
export function BrandMark({
  size = 22,
  className = "",
  withWordmark = false,
}: Props) {
  return (
    <span className={`group inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="animate-brand-breathe text-orange-600 transition-transform group-hover:scale-110"
      >
        <path
          d="M4 18 L10 12 L14 15 L20 6"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="6" r="1.6" fill="currentColor" />
      </svg>
      {withWordmark ? (
        <span className="font-display text-[15px] font-bold tracking-tight text-stone-100 dark:text-stone-100">
          Invoice Chase<span className="text-orange-600">.</span>
        </span>
      ) : null}
    </span>
  );
}
