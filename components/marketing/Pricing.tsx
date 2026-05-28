import { ArrowRight, Check } from "lucide-react";
import { Button } from "./Button";
import { Container } from "./Container";
import { Section } from "./Section";

const INCLUDED: string[] = [
  "Auto SMS + email reminders, throttled and compliant",
  "Claude AI handles replies in your voice, 24/7",
  "One-tap pay links (Stripe + Apple/Google Pay + ACH)",
  "QuickBooks, Xero, Jobber two-way sync",
  "Payment plans for big balances",
  "Customer reputation scoring (300–850)",
  "Weekly \"what we collected\" report",
  "Unlimited customers · owner / manager / tech seats",
];

type FaqItem = { q: string; a: string };

const FAQS: FaqItem[] = [
  {
    q: "How does the 1.9% work?",
    a: "It comes off the top of payments customers make through your Invoice Chase pay link. If they pay $1,000 by card, you net $981. If they pay you another way, you owe us nothing for that invoice.",
  },
  {
    q: "What does it connect to?",
    a: "QuickBooks Online today, Xero and Jobber too. Stripe for payments, Twilio for SMS, Resend for email. One-click OAuth for each.",
  },
  {
    q: "Is it secure?",
    a: "Payments go straight to your Stripe account — they never touch us. Tokens encrypted at rest. Customer data stays in your QuickBooks. SOC 2 posture in place.",
  },
  {
    q: "Can I review messages before they send?",
    a: "Yes — flip \"Owner approval\" on in Settings and every AI-drafted message lands in your approval queue. One-click approve or decline. Off by default so you don't have to babysit.",
  },
];

export function Pricing() {
  return (
    <Section id="pricing" tone="default">
      <Container>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-[680px] text-center">
          <p className="mk-display text-[11px] font-semibold uppercase tracking-[0.18em] text-mk-primary-600">
            One plan
          </p>
          <h2 className="mk-display mt-3 text-[32px] font-bold leading-[1.1] text-mk-ink-950 sm:text-[44px]">
            Less than one unpaid invoice.
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-[17px] leading-7 text-mk-ink-700">
            $49 a month, plus 1.9% on every payment we actually collect for
            you. No setup fee, no per-seat fee, no contract.
          </p>
        </div>

        {/* ── Plan card ─────────────────────────────────────────────── */}
        <div className="mx-auto mt-12 max-w-[920px] overflow-hidden rounded-mk-xl bg-mk-surface shadow-mk-2 ring-1 ring-mk-ink-300/60">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:divide-x lg:divide-mk-ink-300/60">
            {/* Price block */}
            <div className="p-8 sm:p-10">
              <div className="flex items-baseline gap-1">
                <span className="mk-display text-[64px] font-bold leading-none text-mk-ink-950">
                  $49
                </span>
                <span className="text-[15px] text-mk-ink-500">/month</span>
              </div>
              <p className="mt-3 text-[15px] leading-6 text-mk-ink-700">
                <span className="mk-display font-semibold text-mk-primary-600 tabular-nums">
                  + 1.9%
                </span>{" "}
                on each payment we collect for you.
              </p>
              <p className="mt-2 text-[13px] italic text-mk-ink-500">
                If we don&apos;t collect, you don&apos;t pay the percentage.
              </p>

              {/* Framing line — money story, not cost. */}
              <div className="mt-6 rounded-mk-md bg-mk-primary-50 p-4 ring-1 ring-inset ring-mk-primary-100">
                <p className="text-[13px] leading-5 text-mk-primary-700">
                  Recover{" "}
                  <span className="font-mono font-semibold tabular-nums">
                    $5,000
                  </span>{" "}
                  in a month? You pay{" "}
                  <span className="font-mono font-semibold tabular-nums">
                    $49 + $95 = $144
                  </span>
                  . Less than the invoice you got paid first.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  href="/login"
                  size="lg"
                  variant="primary"
                  trailing={<ArrowRight className="h-4 w-4" />}
                >
                  Start collecting
                </Button>
                <p className="text-[12px] text-mk-ink-500">
                  No card required · Cancel anytime
                </p>
              </div>
            </div>

            {/* Included list */}
            <div className="bg-mk-ink-50 p-8 sm:p-10">
              <p className="mk-display text-[11px] font-semibold uppercase tracking-[0.16em] text-mk-ink-500">
                Everything included
              </p>
              <ul className="mt-5 space-y-3">
                {INCLUDED.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-3 text-[14px] leading-6 text-mk-ink-800"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-mk-full bg-mk-accent-50 text-mk-accent-600"
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <div className="mx-auto mt-20 max-w-[760px]">
          <h3 className="mk-display text-center text-[22px] font-semibold text-mk-ink-950 sm:text-[26px]">
            Common questions
          </h3>
          <dl className="mt-8 divide-y divide-mk-ink-300/60">
            {FAQS.map((f) => (
              <div key={f.q} className="py-6">
                <dt className="mk-display text-[16px] font-semibold leading-snug text-mk-ink-950">
                  {f.q}
                </dt>
                <dd className="mt-2 text-[14px] leading-6 text-mk-ink-700">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </Section>
  );
}
