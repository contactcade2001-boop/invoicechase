import { Crown, Mail, MessageSquare } from "lucide-react";
import type { TemplateStat } from "@/lib/server/db/templateStats";

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function pct(n: number, d: number) {
  if (d === 0) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

const TEMPLATE_LABELS: Record<string, { name: string; channel: "sms" | "email" }> = {
  "friendly-sms": { name: "Friendly nudge", channel: "sms" },
  "professional-email": { name: "Professional", channel: "email" },
  "field-service-sms": { name: "Field service", channel: "sms" },
  "warm-email": { name: "Warm follow-up", channel: "email" },
  "firm-sms": { name: "Firm reminder", channel: "sms" },
  "brief-sms": { name: "Ultra-brief", channel: "sms" },
  "sms-default": { name: "Custom SMS", channel: "sms" },
  "email-default": { name: "Custom email", channel: "email" },
};

export function TemplateStatsTable({ rows }: { rows: TemplateStat[] }) {
  const top = rows[0];
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-center gap-2">
        <Crown className="h-3.5 w-3.5 text-orange-600" aria-hidden />
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
          Template performance
        </h2>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Which templates actually drove payments. Updated as your sends are
        delivered, replied to, and paid.
      </p>

      {rows.length === 0 ? (
        <p className="mt-5 rounded-md bg-stone-50 px-4 py-3 text-center text-xs text-stone-500 ring-1 ring-inset ring-stone-200">
          No template data yet. Send a few reminders and stats will populate.
        </p>
      ) : (
        <>
          {top ? (
            <div className="mt-5 rounded-xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 ring-1 ring-amber-200">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                Top performer
              </p>
              <p className="font-display mt-1 text-base font-bold text-stone-900">
                {TEMPLATE_LABELS[top.templateKey]?.name ?? top.templateKey}
              </p>
              <p className="text-xs text-stone-700">
                {fmt(top.paidCents)} collected · {top.paid} paid of{" "}
                {top.sends} sent ({pct(top.paid, top.sends)} pay rate)
              </p>
            </div>
          ) : null}
          <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-stone-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <th className="px-4 py-2.5 text-left">Template</th>
                  <th className="px-4 py-2.5 text-right">Sent</th>
                  <th className="px-4 py-2.5 text-right">Replies</th>
                  <th className="px-4 py-2.5 text-right">Paid</th>
                  <th className="px-4 py-2.5 text-right">Pay rate</th>
                  <th className="px-4 py-2.5 text-right">Collected</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const label = TEMPLATE_LABELS[r.templateKey];
                  return (
                    <tr
                      key={r.templateKey}
                      className="border-b border-stone-100 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {label?.channel === "email" ? (
                            <Mail className="h-3 w-3 text-sky-600" />
                          ) : (
                            <MessageSquare className="h-3 w-3 text-emerald-600" />
                          )}
                          <span className="font-medium text-stone-900">
                            {label?.name ?? r.templateKey}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                        {r.sends}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                        {r.replies}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                        {r.paid}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                        {pct(r.paid, r.sends)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-700">
                        {fmt(r.paidCents)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
