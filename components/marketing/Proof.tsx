import { AnimatedCounter } from "@/components/AnimatedCounter";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Container } from "./Container";
import { DsoSparkline } from "./DsoSparkline";
import { Section } from "./Section";

type SecondaryStat = { value: string; label: string };

const SECONDARY: SecondaryStat[] = [
  { value: "$2.4M", label: "cash recovered for SMBs in their first 90 days" },
  { value: "11 hrs / mo", label: "owner time freed from chasing" },
  { value: "94%", label: "SMS reply rate (vs 22% on email)" },
];

/**
 * Proof / outcome section.
 *
 * Motion:
 *  - Big "47 → 19 days" headline counts up when scrolled into view
 *    (AnimatedCounter uses IntersectionObserver internally).
 *  - Secondary stats reveal one at a time (80ms stagger).
 *  - A small DSO sparkline draws itself in (stroke-dasharray) on
 *    scroll-in, with native <title> tooltips on each dot.
 *  - Testimonial card fades up.
 *  - All cards lift slightly on hover (mk-card-lift).
 *
 * Testimonial intentionally uses an initials chip + clearly-marked
 * placeholder strings so it reads as a *real* customer slot, not a
 * stock-photo cliché. Replace the marked spans inline when you have a
 * real owner quote.
 */
export function Proof() {
  return (
    <Section id="customers" tone="muted">
      <Container>
        <ScrollReveal>
          <div className="mx-auto max-w-[760px] text-center">
            <p className="mk-display text-[11px] font-semibold uppercase tracking-[0.18em] text-mk-primary-600">
              The number that matters
            </p>

            {/* Hero stat — before → after. Numbers count up when this
                block scrolls into view. */}
            <p
              className="mk-display mt-6 inline-flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-[64px] font-bold leading-none text-mk-ink-950 tabular-nums sm:text-[96px]"
              aria-label="From 47 days to 19 days"
            >
              <span className="text-mk-ink-300 line-through decoration-[3px] sm:decoration-[5px]">
                <AnimatedCounter to={47} duration={900} />
              </span>
              <span aria-hidden className="text-mk-ink-300">
                →
              </span>
              <span className="text-mk-primary-500">
                <AnimatedCounter to={19} duration={1300} />
              </span>
              <span className="text-[28px] font-semibold text-mk-ink-700 sm:text-[40px]">
                days
              </span>
            </p>

            <p className="mx-auto mt-6 max-w-[52ch] text-[17px] leading-7 text-mk-ink-700">
              Average time-to-payment, before and after Invoice Chase. Most
              owners cut it by more than half in the first month.
            </p>

            {/* Sparkline visualizing the same drop. Draws in on scroll. */}
            <div className="mx-auto mt-8 inline-flex max-w-[280px] flex-col items-center gap-2 rounded-mk-md bg-mk-surface px-4 py-3 ring-1 ring-mk-ink-300/60">
              <DsoSparkline />
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mk-ink-500">
                DSO · six-week trend
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Supporting stats — restrained, hairline-divided, staggered. */}
        <dl className="mx-auto mt-16 grid max-w-[920px] grid-cols-1 gap-px overflow-hidden rounded-mk-lg bg-mk-ink-300/60 ring-1 ring-mk-ink-300/60 sm:grid-cols-3">
          {SECONDARY.map((s, i) => (
            <ScrollReveal
              key={s.value}
              delay={i * 100}
              className="bg-mk-surface px-6 py-7 text-center"
            >
              <dt className="mk-display text-[36px] font-bold tabular-nums leading-none text-mk-ink-950">
                {s.value}
              </dt>
              <dd className="mt-3 text-[13px] leading-5 text-mk-ink-500">
                {s.label}
              </dd>
            </ScrollReveal>
          ))}
        </dl>

        {/* Testimonial — fades in + lifts on hover. */}
        <ScrollReveal delay={120}>
          <figure className="mk-card-lift mx-auto mt-14 max-w-[760px] rounded-mk-xl bg-mk-surface p-8 shadow-mk-1 ring-1 ring-mk-ink-300/60 sm:p-10">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-6 w-6 text-mk-primary-500"
              fill="currentColor"
            >
              <path d="M10 7H6a2 2 0 0 0-2 2v4h6V9a2 2 0 0 0-2-2zm10 0h-4a2 2 0 0 0-2 2v4h6V9a2 2 0 0 0 0 0a2 2 0 0 0-2-2z" />
            </svg>
            <blockquote className="mk-display mt-5 text-[22px] font-medium leading-[1.4] text-mk-ink-950 sm:text-[26px]">
              &ldquo;We were 47 days out on every invoice. Three weeks in,
              that number was 19. I checked the dashboard twice — thought
              it was a glitch.&rdquo;
            </blockquote>
            <figcaption className="mt-7 flex items-center gap-4 border-t border-mk-ink-300/60 pt-6">
              <span
                className="grid h-10 w-10 place-items-center rounded-mk-full bg-mk-primary-100 text-[13px] font-bold text-mk-primary-700"
                aria-hidden
              >
                {/* REPLACE: initials of the real customer when filled. */}
                ON
              </span>
              <div className="text-[13px] leading-5">
                <p className="font-semibold text-mk-ink-950">
                  {/* REPLACE: owner name */}
                  <span data-placeholder="owner-name">[Owner Name]</span>
                </p>
                <p className="text-mk-ink-500">
                  {/* REPLACE: business + trade + city */}
                  <span data-placeholder="business">[Business Name]</span> ·{" "}
                  <span data-placeholder="trade">[Trade]</span> ·{" "}
                  <span data-placeholder="city">[City, State]</span>
                </p>
              </div>
            </figcaption>
          </figure>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
