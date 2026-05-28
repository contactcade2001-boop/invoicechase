import { Lock, ShieldCheck, UserCheck } from "lucide-react";
import {
  JobberLogo,
  QuickBooksLogo,
  StripeLogo,
  XeroLogo,
} from "@/components/BrandLogos";
import { Container } from "./Container";
import { Section } from "./Section";

type Promise = {
  icon: typeof Lock;
  title: string;
  body: string;
};

const PROMISES: Promise[] = [
  {
    icon: ShieldCheck,
    title: "Payments routed through Stripe",
    body: "Funds go straight to your Stripe account. We never touch your money.",
  },
  {
    icon: Lock,
    title: "Bank-level security",
    body: "OAuth tokens encrypted at rest. Customer data stays in your QuickBooks.",
  },
  {
    icon: UserCheck,
    title: "You stay in control",
    body: "Turn on Owner approval and every AI message lands in your queue before send.",
  },
];

/**
 * Trust layer — integration logos + three short security promises.
 *
 * Logos use the in-house BrandLogos SVGs. These are stylized
 * placeholders — when you get official mark approval from each partner,
 * drop their SVG into components/BrandLogos.tsx and every page that
 * references them updates automatically.
 */
export function Trust() {
  return (
    <Section tone="default" size="tight">
      <Container>
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-mk-ink-500">
          Connects with the tools your business already runs on
        </p>
        <ul
          className="mt-8 grid grid-cols-2 items-center justify-items-center gap-x-8 gap-y-8 sm:grid-cols-4"
          aria-label="Supported integrations"
        >
          {[
            { Logo: QuickBooksLogo, name: "QuickBooks" },
            { Logo: StripeLogo, name: "Stripe" },
            { Logo: XeroLogo, name: "Xero" },
            { Logo: JobberLogo, name: "Jobber" },
          ].map(({ Logo, name }) => (
            <li
              key={name}
              className="flex items-center gap-2.5 opacity-70 grayscale transition-[opacity,filter] duration-200 hover:opacity-100 hover:grayscale-0 focus-within:opacity-100 focus-within:grayscale-0"
            >
              <Logo size={26} />
              <span className="mk-display text-[13px] font-semibold text-mk-ink-700">
                {name}
              </span>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-14 grid max-w-[920px] gap-px overflow-hidden rounded-mk-lg bg-mk-ink-300/60 ring-1 ring-mk-ink-300/60 sm:grid-cols-3">
          {PROMISES.map((p) => (
            <div key={p.title} className="bg-mk-surface p-6">
              <span
                aria-hidden
                className="grid h-9 w-9 place-items-center rounded-mk-md bg-mk-accent-50 text-mk-accent-600"
              >
                <p.icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <h3 className="mk-display mt-4 text-[15px] font-semibold leading-snug text-mk-ink-950">
                {p.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-5 text-mk-ink-700">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
