// Simple, recognizable brand marks for the "Connect" buttons and tiles.
// We use stylized initials in each company's signature color rather than
// pixel-perfect reproductions of the official logos — this stays clear of
// trademark grey areas while still being instantly readable.

type BrandLogoProps = {
  className?: string;
  size?: number;
};

function letterMark(args: {
  bg: string;
  fg: string;
  letter: string;
  size: number;
  rounded?: boolean;
  className?: string;
  ariaLabel: string;
}) {
  const radius = args.rounded ? args.size / 2 : args.size * 0.2;
  return (
    <svg
      role="img"
      aria-label={args.ariaLabel}
      width={args.size}
      height={args.size}
      viewBox="0 0 24 24"
      className={args.className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="24"
        height="24"
        rx={args.rounded ? 12 : (radius * 24) / args.size}
        fill={args.bg}
      />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="13"
        fontWeight="800"
        fill={args.fg}
      >
        {args.letter}
      </text>
    </svg>
  );
}

export function QuickBooksLogo({ className, size = 18 }: BrandLogoProps) {
  return letterMark({
    bg: "#2CA01C",
    fg: "#FFFFFF",
    letter: "qb",
    size,
    rounded: true,
    className,
    ariaLabel: "QuickBooks",
  });
}

export function XeroLogo({ className, size = 18 }: BrandLogoProps) {
  return letterMark({
    bg: "#13B5EA",
    fg: "#FFFFFF",
    letter: "X",
    size,
    rounded: true,
    className,
    ariaLabel: "Xero",
  });
}

export function JobberLogo({ className, size = 18 }: BrandLogoProps) {
  return letterMark({
    bg: "#0B6E47",
    fg: "#FFFFFF",
    letter: "J",
    size,
    rounded: false,
    className,
    ariaLabel: "Jobber",
  });
}

export function StripeLogo({ className, size = 18 }: BrandLogoProps) {
  return letterMark({
    bg: "#635BFF",
    fg: "#FFFFFF",
    letter: "S",
    size,
    rounded: false,
    className,
    ariaLabel: "Stripe",
  });
}

export function HousecallProLogo({ className, size = 18 }: BrandLogoProps) {
  return letterMark({
    bg: "#0F4DBA",
    fg: "#FFFFFF",
    letter: "H",
    size,
    rounded: false,
    className,
    ariaLabel: "Housecall Pro",
  });
}

export function ServiceTitanLogo({ className, size = 18 }: BrandLogoProps) {
  return letterMark({
    bg: "#1A1A1A",
    fg: "#FFFFFF",
    letter: "ST",
    size,
    rounded: false,
    className,
    ariaLabel: "ServiceTitan",
  });
}

export function FieldPulseLogo({ className, size = 18 }: BrandLogoProps) {
  return letterMark({
    bg: "#EF4444",
    fg: "#FFFFFF",
    letter: "FP",
    size,
    rounded: false,
    className,
    ariaLabel: "FieldPulse",
  });
}

export function WorkizLogo({ className, size = 18 }: BrandLogoProps) {
  return letterMark({
    bg: "#0EA5E9",
    fg: "#FFFFFF",
    letter: "W",
    size,
    rounded: false,
    className,
    ariaLabel: "Workiz",
  });
}
