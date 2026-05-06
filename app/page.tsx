import {
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const steps = [
  {
    icon: Building2,
    title: "Connect QuickBooks",
    body: "60-second OAuth. We pull your customers and unpaid invoices automatically.",
  },
  {
    icon: CreditCard,
    title: "See who owes you",
    body: "Every overdue customer in one screen, sorted by risk. Total owed and DSO at a glance.",
  },
  {
    icon: MessageSquare,
    title: "Collect with one click",
    body: "Pay Now opens a Stripe checkout. Text sends an SMS with the link. Bulk-text every overdue customer at once.",
  },
];

const pricingFeatures = [
  "Live QuickBooks sync",
  "One-click Stripe payment links",
  "One-click and bulk SMS reminders",
  "Customer reputation scores",
  "Total owed + DSO at a glance",
  "Cancel anytime",
];

const faq = [
  {
    q: "How long does setup take?",
    a: "About a minute. You connect QuickBooks with a single OAuth click and the dashboard fills with your data immediately.",
  },
  {
    q: "Do you store my customers' card data?",
    a: "No. All payments go through Stripe Checkout — card numbers never touch our servers.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Disconnect with one click; we revoke our access to QuickBooks and delete the connection.",
  },
  {
    q: "What if I don't use QuickBooks?",
    a: "Right now QuickBooks Online is required. Other accounting integrations are on the roadmap.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
          <div className="flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hidden text-slate-600 hover:text-slate-900 sm:inline"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            For QuickBooks-using small businesses
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Stop chasing invoices.
            <br />
            Start getting paid.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
            Connect QuickBooks. See every customer who owes you. Collect with one click.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Get Started
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            $49/month + 1.9% per collected payment. No setup fee.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-700">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-slate-700">
              Privacy Policy
            </Link>
            . Invoice Chase only texts customers you already have a business
            relationship with. Recipients can reply STOP at any time.
          </p>
        </section>

        <section
          id="how-it-works"
          className="border-y border-slate-200 bg-slate-50 py-20"
        >
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Three steps. That&apos;s it.
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <step.icon className="h-5 w-5 text-slate-400" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Simple pricing
            </h2>
            <p className="mt-3 text-center text-slate-600">
              One plan. Cancel anytime.
            </p>
            <div className="mt-10 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight">$49</span>
                <span className="text-lg text-slate-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Plus 1.9% per payment collected through Invoice Chase.
              </p>
              <ul className="mt-6 space-y-2.5">
                {pricingFeatures.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Get Started
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Questions?
            </h2>
            <dl className="mt-10 space-y-6">
              {faq.map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl bg-white p-5 ring-1 ring-slate-200"
                >
                  <dt className="font-semibold text-slate-900">{item.q}</dt>
                  <dd className="mt-2 text-sm text-slate-600">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-slate-900 py-16 text-white">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Stop chasing. Start collecting.
            </h2>
            <p className="mt-3 text-slate-300">
              Connect QuickBooks in 60 seconds and see what you&apos;re owed.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
            >
              Get Started
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row">
          <span className="font-semibold text-slate-700">Invoice Chase</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-700">
              Terms
            </Link>
            <span>&copy; {new Date().getFullYear()} Invoice Chase</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
