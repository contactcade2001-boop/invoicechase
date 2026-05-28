import type { ReactNode } from "react";
import { Container } from "./Container";
import { Section } from "./Section";

type Step = {
  number: string;
  title: string;
  body: string;
  visual: ReactNode;
};

/**
 * Visuals for the three steps. Each is a stylized placeholder built
 * with markup — swap individually for real screenshots later by
 * replacing the body of any one component below. The outer card
 * framing stays.
 */
function ConnectVisual() {
  return (
    <div className="grid gap-2.5">
      <div className="flex items-center gap-3 rounded-mk-md bg-mk-surface px-3.5 py-3 ring-1 ring-mk-ink-300/60">
        <div className="h-7 w-7 rounded-mk-sm bg-mk-ink-100 ring-1 ring-mk-ink-300/60" />
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-mk-ink-950">
            QuickBooks Online
          </p>
          <p className="text-[10px] text-mk-ink-500">
            Pull invoices + customers
          </p>
        </div>
        <span className="rounded-mk-full bg-mk-accent-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-mk-accent-600">
          Connected
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-mk-md bg-mk-surface/60 px-3.5 py-3 ring-1 ring-mk-ink-300/60">
        <div className="h-7 w-7 rounded-mk-sm bg-mk-ink-100" />
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-mk-ink-700">Xero</p>
          <p className="text-[10px] text-mk-ink-500">Alternative source</p>
        </div>
        <span className="text-[10px] text-mk-ink-500">Switch any time</span>
      </div>
    </div>
  );
}

function TextVisual() {
  return (
    <div className="space-y-2">
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-2xl bg-mk-surface px-3 py-2 text-[12px] leading-snug text-mk-ink-800 ring-1 ring-mk-ink-300/60">
          Hey Carlos — friendly reminder $850 from 9/12 is past due.
          Pay in one tap:{" "}
          <span className="text-mk-primary-500 underline">
            invoicechase.com/p/x9
          </span>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-mk-ink-100 px-3 py-2 text-[12px] leading-snug text-mk-ink-800">
          can I split it 2 ways?
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-2xl bg-mk-surface px-3 py-2 text-[12px] leading-snug text-mk-ink-800 ring-1 ring-mk-ink-300/60">
          Of course — $425 this Friday and $425 next? I&apos;ll set it up.
          <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-mk-accent-600">
            Sent by AI · in your voice
          </p>
        </div>
      </div>
    </div>
  );
}

function PaidVisual() {
  const rows = [
    { name: "Carlos B.", amount: "$425.00", when: "Just now" },
    { name: "Maria S.", amount: "$1,240.00", when: "2m ago" },
    { name: "Hernandez Co.", amount: "$3,150.00", when: "1h ago" },
  ];
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mk-ink-500">
          Today
        </p>
        <p className="font-mono text-[12px] font-semibold tabular-nums text-mk-accent-600">
          +$4,815.00
        </p>
      </div>
      {rows.map((r) => (
        <div
          key={r.name}
          className="flex items-center gap-3 rounded-mk-md bg-mk-surface px-3 py-2 ring-1 ring-mk-ink-300/60"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-mk-accent-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-mk-ink-950">
              {r.name}
            </p>
            <p className="text-[10px] text-mk-ink-500">{r.when}</p>
          </div>
          <p className="font-mono text-[12px] font-semibold tabular-nums text-mk-ink-800">
            {r.amount}
          </p>
        </div>
      ))}
    </div>
  );
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Connect QuickBooks",
    body: "One click. We pull every overdue invoice automatically.",
    visual: <ConnectVisual />,
  },
  {
    number: "02",
    title: "We text in your voice",
    body: "Each customer gets a personalized reminder with a one-tap pay link. Replies handled by Claude AI — sounds like you wrote it.",
    visual: <TextVisual />,
  },
  {
    number: "03",
    title: "Money posts back",
    body: "Payments hit your Stripe in seconds and reconcile to QuickBooks the same minute. You just watch.",
    visual: <PaidVisual />,
  },
];

export function HowItWorks() {
  return (
    <Section id="product" tone="default">
      <Container>
        <div className="mx-auto max-w-[640px] text-center">
          <p className="mk-display text-[11px] font-semibold uppercase tracking-[0.18em] text-mk-primary-600">
            Three steps. Sixty seconds.
          </p>
          <h2 className="mk-display mt-3 text-[32px] font-bold leading-[1.1] text-mk-ink-950 sm:text-[44px]">
            Set it up once. Let it land.
          </h2>
        </div>

        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.number}
              className="group relative flex flex-col rounded-mk-lg bg-mk-surface p-6 shadow-mk-1 ring-1 ring-mk-ink-300/60"
            >
              <div className="flex items-center gap-3">
                <span className="mk-display font-mono text-[12px] font-semibold tracking-[0.12em] text-mk-primary-600">
                  {s.number}
                </span>
                <span
                  aria-hidden
                  className="h-px flex-1 bg-mk-ink-300/60"
                />
              </div>
              <h3 className="mk-display mt-4 text-[20px] font-semibold leading-snug text-mk-ink-950">
                {s.title}
              </h3>
              <p className="mt-2 text-[14px] leading-6 text-mk-ink-700">
                {s.body}
              </p>
              <div className="mt-6 rounded-mk-md bg-mk-ink-50 p-4 ring-1 ring-mk-ink-300/60">
                {s.visual}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
