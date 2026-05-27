import Link from "next/link";
import {
  AlertOctagon,
  Banknote,
  CalendarClock,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Target,
} from "lucide-react";
import { formatCurrencyDetailed } from "@/lib/format";
import type { Play, PlaysResult } from "@/lib/server/insights/plays";

const ACTION_META: Record<
  Play["action"],
  { label: string; Icon: typeof MessageSquare; color: string }
> = {
  text: { label: "Text", Icon: MessageSquare, color: "text-emerald-700" },
  email: { label: "Email", Icon: Mail, color: "text-sky-700" },
  call: { label: "Call", Icon: Phone, color: "text-violet-700" },
  payment_plan: {
    label: "Payment plan",
    Icon: CalendarClock,
    color: "text-amber-700",
  },
  deposit: { label: "Deposit", Icon: Banknote, color: "text-emerald-700" },
  escalate: { label: "Escalate", Icon: AlertOctagon, color: "text-red-700" },
};

function relativeAge(ms: number): string {
  const ageMin = Math.floor((Date.now() - ms) / 60_000);
  if (ageMin < 1) return "just now";
  if (ageMin < 60) return `${ageMin}m ago`;
  const ageHr = Math.floor(ageMin / 60);
  if (ageHr < 24) return `${ageHr}h ago`;
  return `${Math.floor(ageHr / 24)}d ago`;
}

export function TodaysPlaysCard({ result }: { result: PlaysResult }) {
  if (result.plays.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Target className="h-3 w-3" aria-hidden /> Today&apos;s plays
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Everyone&apos;s current. Nothing urgent today.
        </p>
      </section>
    );
  }

  const totalExpected = result.plays.reduce(
    (s, p) => s + p.expectedCents,
    0,
  );

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Target className="h-3 w-3" aria-hidden /> Today&apos;s plays
            {result.source === "claude" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <Sparkles className="h-2.5 w-2.5" aria-hidden /> AI
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                Rule-based
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {result.plays.length} action{result.plays.length === 1 ? "" : "s"}
            {totalExpected > 0
              ? ` · ${formatCurrencyDetailed(totalExpected)} potential cash unlocked`
              : ""}
          </p>
        </div>
        <p className="text-[10px] text-slate-400" title="Cached for 6 hours">
          {relativeAge(result.generatedAt)}
        </p>
      </div>
      <ol className="mt-4 space-y-2">
        {result.plays.map((play, i) => {
          const meta = ACTION_META[play.action];
          return (
            <li
              key={`${play.customerId}-${play.action}-${i}`}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <Link
                    href={`/dashboard/customer/${play.customerId}`}
                    className="font-semibold text-slate-900 hover:underline"
                  >
                    {play.customerName}
                  </Link>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${meta.color}`}
                  >
                    <meta.Icon className="h-3 w-3" aria-hidden />
                    {meta.label}
                  </span>
                  {play.expectedCents > 0 ? (
                    <span className="ml-auto text-xs font-semibold tabular-nums text-emerald-700">
                      ~{formatCurrencyDetailed(play.expectedCents)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {play.reason}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
