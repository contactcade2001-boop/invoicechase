import { ArrowRight } from "lucide-react";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "./Button";
import { Container } from "./Container";
import { HeroVideo } from "./HeroVideo";
import { Section } from "./Section";

/**
 * Landing hero. Outcome-first headline + plain-English mechanism subhead
 * + two CTAs. Visual sits to the right on desktop, stacks below on
 * mobile. Headline copy is intentionally direct (contractor voice).
 *
 * Motion:
 *  - Two slow-drifting blob layers in the background (mk-mesh-*). Pure
 *    CSS, only animates on >=768px. Static on mobile + reduced-motion.
 *  - Stat band under the CTAs has count-up numbers on mount via
 *    AnimatedCounter (rAF, IntersectionObserver-gated).
 *
 * PLACEHOLDER: the stat-band numbers are illustrative. Swap with real
 * figures once they exist.
 */
export function Hero() {
  return (
    <Section as="header" tone="muted" className="relative overflow-hidden">
      {/* Animated mesh layer — two blobs that drift slowly. The container
          is pointer-events-none and aria-hidden; the static fallback
          gradient still reads underneath. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(900px 480px at 85% -10%, rgba(209,74,31,0.10) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="mk-mesh-a pointer-events-none absolute -left-20 top-[10%] -z-0 h-[28rem] w-[28rem] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(209,74,31,0.18) 0%, rgba(209,74,31,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="mk-mesh-b pointer-events-none absolute -right-24 top-[30%] -z-0 h-[26rem] w-[26rem] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(14,82,64,0.14) 0%, rgba(14,82,64,0) 70%)",
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

            {/* Animated trust band — counts up on first paint. */}
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-mk-md bg-mk-ink-300/60 ring-1 ring-mk-ink-300/60 sm:max-w-md">
              <div className="bg-mk-ink-50 px-4 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mk-ink-500">
                  Trusted by
                </dt>
                <dd className="mk-display mt-1 text-[20px] font-bold leading-none tabular-nums text-mk-ink-950">
                  <AnimatedCounter
                    to={1847}
                    duration={1400}
                    suffix="+"
                  />
                  <span className="ml-1 text-[12px] font-medium text-mk-ink-500">
                    SMBs
                  </span>
                </dd>
              </div>
              <div className="bg-mk-ink-50 px-4 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mk-ink-500">
                  Collected this quarter
                </dt>
                <dd className="mk-display mt-1 text-[20px] font-bold leading-none tabular-nums text-mk-ink-950">
                  <AnimatedCounter
                    to={4_200_000}
                    duration={1600}
                    prefix="$"
                  />
                </dd>
              </div>
            </dl>
          </div>
          <div className="lg:pl-4">
            <div className="mk-card-lift">
              <HeroVideo />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
