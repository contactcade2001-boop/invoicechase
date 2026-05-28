import { ArrowRight } from "lucide-react";
import { Button } from "./Button";
import { Container } from "./Container";
import { HeroVisual } from "./HeroVisual";
import { Section } from "./Section";

/**
 * Landing hero. Outcome-first headline + plain-English mechanism subhead
 * + two CTAs. Visual sits to the right on desktop, stacks below on
 * mobile. Headline copy is intentionally direct (contractor voice).
 */
export function Hero() {
  return (
    <Section as="header" tone="muted" className="relative overflow-hidden">
      {/* Subtle warm wash radiating from the top-right corner. Static, no
          animation — keeps the page light on a contractor's phone. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(900px 480px at 85% -10%, rgba(209,74,31,0.10) 0%, transparent 60%)",
        }}
      />
      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="mk-display text-[11px] font-semibold uppercase tracking-[0.18em] text-mk-primary-600">
              Built for service businesses
            </p>
            <h1 className="mk-display mt-5 text-[44px] font-bold leading-[1.05] text-mk-ink-950 sm:text-[56px] lg:text-[72px]">
              You did the work.
              <br />
              <span className="text-mk-primary-500">
                Get paid this week.
              </span>
            </h1>
            <p className="mt-6 max-w-[44ch] text-[17px] leading-7 text-mk-ink-700">
              Connect QuickBooks and overdue customers get a polite text with
              a one-tap pay link. Claude answers their replies in your
              voice — you just watch the deposits land.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                href="/login"
                size="lg"
                variant="primary"
                trailing={<ArrowRight className="h-4 w-4" />}
              >
                Connect QuickBooks
              </Button>
              <Button href="/demo" size="lg" variant="secondary">
                See it work
              </Button>
            </div>
            <p className="mt-5 text-[13px] text-mk-ink-500">
              $49/month + 1.9% per collected payment · No card required to
              start
            </p>
          </div>
          <div className="lg:pl-4">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </Section>
  );
}
