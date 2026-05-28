import {
  FieldPulseLogo,
  HousecallProLogo,
  JobberLogo,
  QuickBooksLogo,
  ServiceTitanLogo,
  StripeLogo,
  WorkizLogo,
  XeroLogo,
} from "@/components/BrandLogos";

const LOGOS: { Logo: typeof QuickBooksLogo; name: string }[] = [
  { Logo: QuickBooksLogo, name: "QuickBooks" },
  { Logo: XeroLogo, name: "Xero" },
  { Logo: JobberLogo, name: "Jobber" },
  { Logo: HousecallProLogo, name: "Housecall Pro" },
  { Logo: ServiceTitanLogo, name: "ServiceTitan" },
  { Logo: FieldPulseLogo, name: "FieldPulse" },
  { Logo: WorkizLogo, name: "Workiz" },
  { Logo: StripeLogo, name: "Stripe" },
];

/**
 * Stripe-style horizontal logo marquee. Two copies of the list translate
 * left at constant speed so the loop appears seamless. Pauses on hover.
 */
export function LogoMarquee() {
  const doubled = [...LOGOS, ...LOGOS];
  return (
    <div className="scroll-x-pause scroll-x-mask relative overflow-hidden">
      <div className="animate-scroll-x flex w-max items-center gap-16 py-2">
        {doubled.map((it, i) => (
          <div
            key={`${it.name}-${i}`}
            className="flex shrink-0 items-center gap-2.5 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
          >
            <it.Logo size={28} />
            <span className="font-display text-sm font-semibold tracking-tight text-stone-700">
              {it.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
