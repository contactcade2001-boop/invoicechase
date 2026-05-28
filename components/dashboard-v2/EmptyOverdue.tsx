import { Check } from "lucide-react";

/**
 * No-overdue empty state. Reassuring + glanceable. Avoids the
 * generic "nothing to show" voice.
 */
export function EmptyOverdue() {
  return (
    <div className="mt-3 flex items-start gap-4 rounded-mk-md bg-mk-accent-50 p-5">
      <span
        aria-hidden
        className="grid h-9 w-9 shrink-0 place-items-center rounded-mk-full bg-mk-accent-500 text-white"
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
      <div>
        <p className="mk-display text-[15px] font-semibold text-mk-accent-700">
          You&apos;re all caught up.
        </p>
        <p className="mt-1 text-[13px] leading-5 text-mk-accent-700/80">
          Nothing overdue right now. We&apos;ll text customers
          automatically the day after an invoice goes past due.
        </p>
      </div>
    </div>
  );
}
