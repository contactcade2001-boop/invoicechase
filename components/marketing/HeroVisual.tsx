/**
 * PLACEHOLDER — swap with a real screenshot later.
 *
 * Renders a phone-frame containing a stylized SMS thread: inbound
 * reminder from the business + the customer's reply + a "Paid"
 * confirmation. Built with pure markup so it scales crisply and has
 * zero asset cost — no external image needed. When you have a real
 * screenshot, replace the inner <div className="mk-hero-mock"> with
 * an <Image> and you're done; the framing stays.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      {/* Soft halo behind the phone for depth. */}
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-mk-primary-100 via-mk-primary-50 to-transparent blur-2xl"
      />
      <div className="overflow-hidden rounded-[36px] bg-mk-ink-950 p-3 shadow-mk-3 ring-1 ring-mk-ink-950/10">
        <div className="overflow-hidden rounded-[28px] bg-mk-ink-50">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2 font-mono text-[11px] text-mk-ink-700">
            <span>9:41</span>
            <span className="font-medium">Messages</span>
            <span className="opacity-50">●●●</span>
          </div>
          {/* Conversation header */}
          <div className="border-y border-mk-ink-300/60 bg-mk-surface px-5 py-3 text-center">
            <p className="text-[13px] font-semibold text-mk-ink-950">
              Honest Plumbing &amp; Drain
            </p>
            <p className="text-[11px] text-mk-ink-500">+1 (512) 555-0142</p>
          </div>
          {/* Messages — placeholder content. Swap for screenshot when ready. */}
          <div className="mk-hero-mock space-y-2 px-4 py-5">
            <Bubble side="in">
              Hi Maria — quick reminder your $1,240 invoice from 8/14 is
              outstanding. You can pay in 30 seconds:
              <br />
              <span className="text-mk-primary-500 underline">
                invoicechase.com/p/m4
              </span>
              <br />
              Reply STOP to opt out.
            </Bubble>
            <Bubble side="out">got it — paying now 👍</Bubble>
            <PaidPill amount="$1,240.00" />
            <Bubble side="in" timestamp="9:43 AM">
              Thanks Maria! Receipt is on its way to your email.
            </Bubble>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  children,
  side,
  timestamp,
}: {
  children: React.ReactNode;
  side: "in" | "out";
  timestamp?: string;
}) {
  return (
    <div
      className={`flex ${side === "out" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${
          side === "out"
            ? "bg-mk-primary-500 text-white"
            : "bg-mk-surface text-mk-ink-800 ring-1 ring-mk-ink-300/60"
        }`}
      >
        {children}
        {timestamp ? (
          <p className="mt-1 text-[10px] opacity-60">{timestamp}</p>
        ) : null}
      </div>
    </div>
  );
}

function PaidPill({ amount }: { amount: string }) {
  return (
    <div className="flex justify-center pt-2">
      <span className="inline-flex items-center gap-2 rounded-mk-full bg-mk-accent-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-mk-accent-600">
        <span className="h-1.5 w-1.5 rounded-full bg-mk-accent-500" />
        Paid · {amount}
      </span>
    </div>
  );
}
