import { ArrowRight } from "lucide-react";
import { Button } from "./Button";
import { Container } from "./Container";
import { Section } from "./Section";

/**
 * Closing CTA — restates the core promise in one short sentence and
 * gives the visitor one obvious next action. Dark inverted tone caps
 * the page with weight + visual finality.
 */
export function FinalCta() {
  return (
    <Section as="aside" tone="ink" aria-label="Get started">
      <Container width="narrow">
        <div className="text-center">
          <h2 className="mk-display text-[36px] font-bold leading-[1.1] text-white sm:text-[52px]">
            Stop chasing.
            <br />
            <span className="text-mk-primary-400">Start banking.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[44ch] text-[17px] leading-7 text-white/70">
            Connect QuickBooks in 60 seconds. Watch the deposits land this
            week.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              href="/login"
              size="lg"
              variant="primary"
              trailing={<ArrowRight className="h-4 w-4" />}
            >
              Connect QuickBooks
            </Button>
            <Button
              href="/demo"
              size="lg"
              variant="ghost"
              className="!text-white hover:!bg-white/10 hover:!text-white"
            >
              See a live demo
            </Button>
          </div>
          <p className="mt-5 text-[12px] text-white/50">
            No card required · Cancel anytime · 1.9% only when we collect
          </p>
        </div>
      </Container>
    </Section>
  );
}
