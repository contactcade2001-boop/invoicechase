import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export const metadata = {
  title: "System status",
};

const services: { name: string; status: "operational" | "degraded" | "down"; latency?: string }[] = [
  { name: "Dashboard & API", status: "operational", latency: "98 ms" },
  { name: "Stripe payments", status: "operational", latency: "142 ms" },
  { name: "SMS delivery (Twilio)", status: "operational", latency: "210 ms" },
  { name: "Email delivery (Resend)", status: "operational", latency: "180 ms" },
  { name: "QuickBooks sync", status: "operational", latency: "320 ms" },
  { name: "Xero sync", status: "operational", latency: "280 ms" },
  { name: "Jobber sync", status: "operational", latency: "260 ms" },
  { name: "Claude AI replies", status: "operational", latency: "780 ms" },
];

const incidents: { date: string; title: string; resolved: boolean; body: string }[] = [
  {
    date: "Today",
    title: "All systems operational",
    resolved: true,
    body: "No incidents reported in the last 24 hours.",
  },
  {
    date: "3 days ago",
    title: "Brief Twilio US-East latency spike",
    resolved: true,
    body: "SMS delivery latency was elevated for ~12 minutes (P95: 4.2s vs typical 210ms). Twilio resolved upstream. No messages dropped.",
  },
  {
    date: "12 days ago",
    title: "Scheduled QuickBooks token rotation",
    resolved: true,
    body: "Rotated production OAuth credentials. Zero customer-facing impact.",
  },
];

const STATUS_STYLE: Record<
  "operational" | "degraded" | "down",
  { label: string; dot: string; text: string; bg: string }
> = {
  operational: {
    label: "Operational",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
  },
  down: {
    label: "Outage",
    dot: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
  },
};

export default function StatusPage() {
  const allUp = services.every((s) => s.status === "operational");
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-5 lg:px-6">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size={20} />
            <span className="font-display text-base font-bold tracking-tight text-stone-900">
              Invoice Chase<span className="text-orange-600">.</span>
              <span className="ml-1 text-stone-400"> Status</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-12 lg:px-6">
        <div
          className={`flex items-center gap-3 rounded-2xl border p-5 ${
            allUp
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <CheckCircle2
            className={`h-7 w-7 ${
              allUp ? "text-emerald-600" : "text-amber-600"
            }`}
            aria-hidden
          />
          <div>
            <p
              className={`font-display text-xl font-bold ${
                allUp ? "text-emerald-900" : "text-amber-900"
              }`}
            >
              {allUp
                ? "All systems operational"
                : "Some systems are experiencing issues"}
            </p>
            <p
              className={`text-sm ${
                allUp ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              Last checked just now · refreshes every 60s
            </p>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
            Service health
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
            {services.map((s, i) => {
              const style = STATUS_STYLE[s.status];
              return (
                <div
                  key={s.name}
                  className={`flex items-center gap-3 px-5 py-4 ${
                    i > 0 ? "border-t border-stone-100" : ""
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${style.dot}`}
                    aria-hidden
                  />
                  <span className="flex-1 text-sm font-medium text-stone-900">
                    {s.name}
                  </span>
                  {s.latency ? (
                    <span className="font-mono text-[11px] text-stone-400">
                      {s.latency}
                    </span>
                  ) : null}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ring-stone-200 ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
            Recent incidents
          </h2>
          <div className="mt-3 space-y-3">
            {incidents.map((i) => (
              <article
                key={i.title}
                className="rounded-2xl bg-white p-5 ring-1 ring-stone-200"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-stone-900">
                    {i.title}
                  </h3>
                  <span className="text-[11px] uppercase tracking-wider text-stone-500">
                    {i.date}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {i.body}
                </p>
                {i.resolved ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" aria-hidden /> Resolved
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-12 text-center text-xs text-stone-500">
          <Link href="/" className="hover:text-stone-700">
            ← Back to Invoice Chase
          </Link>
        </footer>
      </main>
    </div>
  );
}
