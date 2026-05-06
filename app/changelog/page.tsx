import Link from "next/link";

export const metadata = {
  title: "Changelog — Invoice Chase",
};

type Entry = {
  date: string;
  tag?: "Launch" | "New" | "Fix" | "Improvement";
  items: string[];
};

const ENTRIES: Entry[] = [
  {
    date: "May 6, 2026",
    tag: "Launch",
    items: [
      "Admin dashboard for the Invoice Chase team — orgs, MRR, partners, recent webhook events at a glance.",
      "Custom branding: paste a logo URL and it shows up in the customer portal + receipt emails.",
      "A2P 10DLC tracker in Settings — capture brand + campaign status; SMS sending can be gated on approval via REQUIRE_A2P.",
      "Email reminders: send by email alongside SMS, with per-org HTML template.",
      "AR aging + monthly reconciliation CSV exports for accountants.",
      "Customer-to-customer referrals: each org gets a /r/biz/<code> link; first month free when both sides convert.",
      "Stripe Connect partner payouts: partners onboard their own Connect Express account; one-click transfer per commission.",
      "Payment plans: split a balance into N installments with auto-generated pay links.",
      "/help and /changelog pages.",
    ],
  },
  {
    date: "May 5, 2026",
    tag: "New",
    items: [
      "QuickBooks App Marketplace listing preview at /integrations/quickbooks.",
      "ProAdvisor Partner Program with 20% recurring commission, /partners marketing page, /partner dashboard.",
    ],
  },
  {
    date: "May 4, 2026",
    tag: "Improvement",
    items: [
      "Per-org dashboard cache with 60s TTL and a Refresh button — dashboards now load instantly instead of waiting on QuickBooks.",
      "Cache invalidates on payment + refund + disconnect; warms in the background after the OAuth callback.",
    ],
  },
  {
    date: "May 3, 2026",
    tag: "Launch",
    items: [
      "Magic-link rate limiting (per-email) on merchant + customer-portal sign-in.",
      "Carrier-compliant STOP / HELP / START handling for inbound SMS with per-org opt-out tracking.",
      "/privacy and /terms pages.",
    ],
  },
];

const TAG_STYLE: Record<NonNullable<Entry["tag"]>, string> = {
  Launch: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  New: "bg-sky-100 text-sky-800 ring-sky-200",
  Improvement: "bg-amber-100 text-amber-800 ring-amber-200",
  Fix: "bg-slate-100 text-slate-700 ring-slate-200",
};

export default function ChangelogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/help" className="text-slate-600 hover:text-slate-900">
              Help
            </Link>
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Changelog
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          What we&apos;ve shipped recently. Want a feature? Email{" "}
          <span className="font-mono">feedback@invoicechase.com</span>.
        </p>
        <ol className="mt-10 space-y-10">
          {ENTRIES.map((entry) => (
            <li
              key={entry.date}
              className="border-l-2 border-slate-200 pl-6"
            >
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  {entry.date}
                </p>
                {entry.tag ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TAG_STYLE[entry.tag]}`}
                  >
                    {entry.tag}
                  </span>
                ) : null}
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                {entry.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-slate-400">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </main>
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">Invoice Chase</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
