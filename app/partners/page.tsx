import {
  ArrowRight,
  Banknote,
  Calculator,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Invoice Chase Partner Program",
  description:
    "Earn 20% recurring commission on every Invoice Chase subscription you refer. Designed for QuickBooks ProAdvisors, bookkeepers, and accountants.",
};

const HOW_IT_WORKS = [
  {
    icon: LinkIcon,
    title: "1. Get your link",
    body: "Apply in under a minute. We generate a permanent referral link you can share anywhere.",
  },
  {
    icon: Sparkles,
    title: "2. Share with clients",
    body: "Drop the link into your onboarding emails, monthly check-ins, or your firm's resource page.",
  },
  {
    icon: Banknote,
    title: "3. Earn monthly",
    body: "Every customer attributed to you pays $49/month. You earn 20% — for as long as they stay subscribed.",
  },
];

const FAQ = [
  {
    q: "Who's the program for?",
    a: "QuickBooks ProAdvisors, bookkeepers, and accountants who manage QuickBooks for field-service and trade SMBs (HVAC, plumbing, landscaping, electrical, etc.). If you have clients who chase invoices manually, this is for you.",
  },
  {
    q: "What does the customer get for $49/month?",
    a: "Live QuickBooks sync, one-click + bulk SMS reminders, Stripe payment links, automated payment posting back to QuickBooks, branded customer portal, and reputation scoring. Plus 1.9% per collected payment (Stripe fees on top).",
  },
  {
    q: "How do I get paid?",
    a: "Monthly. Once a referral pays, we accrue your 20% commission and send a payout statement to your email each month. You acknowledge receipt from the partner dashboard once funds land.",
  },
  {
    q: "Is the commission really recurring?",
    a: "Yes. As long as your referred customer stays on the $49/month plan, you keep earning 20%. Plus 20% of any platform fees they pay us on collected payments.",
  },
  {
    q: "What happens if a customer churns?",
    a: "Their commissions stop accruing. Past commissions still pay out as scheduled.",
  },
  {
    q: "Can I refer myself or my own firm?",
    a: "No — self-referrals are blocked.",
  },
];

const REVENUE_EXAMPLE = [
  {
    label: "10 SMB clients",
    sub: "$49/month × 20% × 10 = $98/month",
    accent: "$98",
  },
  {
    label: "30 SMB clients",
    sub: "$49/month × 20% × 30 = $294/month",
    accent: "$294",
  },
  {
    label: "30 SMB clients + $50k/yr in collected payments each",
    sub: "Subscription + 20% of $19,000 in platform fees",
    accent: "$610+",
  },
];

export default function PartnersLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-stone-900">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/partner" className="text-stone-600 hover:text-stone-900">
              Partner sign-in
            </Link>
            <Link
              href="/partners/apply"
              className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Apply
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="border-b border-stone-200 bg-gradient-to-b from-emerald-50/40 to-white">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              For QuickBooks ProAdvisors &amp; bookkeepers
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Earn 20% recurring on every QuickBooks SMB you refer.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-7 text-stone-600">
              Your bookkeeping and accounting clients chase overdue invoices
              every week. Send them Invoice Chase and we&apos;ll send you 20%
              of every dollar they pay us — for as long as they&apos;re a
              customer.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/partners/apply"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Apply now
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-white"
              >
                How it works
              </a>
            </div>
            <p className="mt-4 text-xs text-stone-500">
              Free to join · no minimums · paid monthly
            </p>
          </div>
        </section>

        <section id="how-it-works" className="border-b border-stone-200 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Three steps to recurring revenue
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {HOW_IT_WORKS.map((step) => (
                <div
                  key={step.title}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200"
                >
                  <step.icon
                    className="h-5 w-5 text-emerald-600"
                    aria-hidden
                  />
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-stone-200 bg-white py-16">
          <div className="mx-auto max-w-3xl px-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Calculator className="h-4 w-4" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wide">
                What you can earn
              </p>
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              An active ProAdvisor portfolio is worth $900–$1,800+/month
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              The math is simple: you bring us a QuickBooks-using SMB, we
              charge them $49/month plus 1.9% on collected payments, and we
              send you 20% of all of it.
            </p>
            <div className="mt-6 space-y-3">
              {REVENUE_EXAMPLE.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl bg-white px-5 py-4 ring-1 ring-stone-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {row.label}
                    </p>
                    <p className="text-xs text-stone-500">{row.sub}</p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-emerald-700">
                    {row.accent}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-stone-500">
              Numbers above assume customers stay subscribed. Per-payment
              commission depends on how much money your customer collects
              through Invoice Chase.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-3xl font-bold tracking-tight">FAQ</h2>
            <dl className="mt-10 space-y-4">
              {FAQ.map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl bg-white p-5 ring-1 ring-stone-200"
                >
                  <dt className="font-semibold text-stone-900">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-6 text-stone-600">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-slate-900 py-14 text-white">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to start earning?
            </h2>
            <p className="mt-3 text-slate-300">
              Apply in under a minute. We&apos;ll email your link and dashboard
              right away.
            </p>
            <Link
              href="/partners/apply"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-base font-semibold text-stone-900 shadow-sm hover:bg-slate-100"
            >
              Apply now
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 text-sm text-stone-500">
          <span className="font-semibold text-stone-700">Invoice Chase</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-stone-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-stone-700">
              Terms
            </Link>
            <Link
              href="/integrations/quickbooks"
              className="hover:text-stone-700"
            >
              QuickBooks app
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
