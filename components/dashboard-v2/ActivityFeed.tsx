import {
  Banknote,
  MessageSquare,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { ActivityItem, ActivityKind } from "@/lib/dashboard/types";

const ICON: Record<ActivityKind, LucideIcon> = {
  payment: Banknote,
  reminder_sent: MessageSquare,
  ai_reply: Sparkles,
  customer_added: UserPlus,
};

// Accent palette per kind. Kept restrained — accent tint for cash,
// primary tint for AI moments, neutral for the rest.
const TINT: Record<
  ActivityKind,
  { bg: string; text: string }
> = {
  payment: { bg: "bg-mk-accent-50", text: "text-mk-accent-700" },
  reminder_sent: { bg: "bg-mk-ink-100", text: "text-mk-ink-700" },
  ai_reply: { bg: "bg-mk-primary-50", text: "text-mk-primary-700" },
  customer_added: { bg: "bg-mk-ink-100", text: "text-mk-ink-700" },
};

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section
      aria-label="Recent activity"
      className="rounded-mk-xl bg-mk-surface p-6 shadow-mk-1 ring-1 ring-mk-ink-300/60"
    >
      <h2 className="mk-display text-[18px] font-semibold text-mk-ink-950">
        Recent activity
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-[13px] text-mk-ink-500">
          Nothing yet. Activity shows up here as soon as a reminder fires
          or a payment lands.
        </p>
      ) : (
        <ul className="mt-5 space-y-3.5">
          {items.map((it) => {
            const Icon = ICON[it.kind];
            const tint = TINT[it.kind];
            return (
              <li key={it.id} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-mk-full ${tint.bg} ${tint.text}`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-mk-ink-950">
                    {it.headline}
                  </p>
                  {it.subtitle ? (
                    <p className="mt-0.5 truncate text-[12px] text-mk-ink-500">
                      {it.subtitle}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-mk-ink-500">
                  {relativeTime(it.occurredAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
