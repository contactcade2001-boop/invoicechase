import Link from "next/link";

export const metadata = {
  title: "Help — Invoice Chase",
};

const SECTIONS: {
  title: string;
  items: { q: string; a: React.ReactNode }[];
}[] = [
  {
    title: "Getting started",
    items: [
      {
        q: "How do I connect QuickBooks?",
        a: (
          <p>
            Sign in, then click <strong>Connect QuickBooks</strong> on the
            onboarding checklist. We open Intuit&apos;s OAuth flow; once you
            confirm, your customers and open invoices appear on the dashboard
            within a few seconds.
          </p>
        ),
      },
      {
        q: "Why don't I see all my customers?",
        a: (
          <p>
            We only show customers with at least one open invoice. Customers
            with a zero balance are hidden by default to keep the &ldquo;who
            owes me&rdquo; view actionable.
          </p>
        ),
      },
      {
        q: "How do I send a text reminder?",
        a: (
          <p>
            Click the <strong>Text</strong> button on any customer row. To
            send to every overdue customer at once, hit the big red{" "}
            <strong>Text ALL N overdue customers NOW</strong> button on the
            dashboard.
          </p>
        ),
      },
    ],
  },
  {
    title: "SMS &amp; compliance",
    items: [
      {
        q: "What if a customer replies STOP?",
        a: (
          <p>
            We honor it automatically. We mark them opted-out for your
            business and refuse to send further texts to that number until
            they reply <span className="font-mono">START</span>. Bulk-text
            counts opted-out customers as <em>skipped</em>, not failed.
          </p>
        ),
      },
      {
        q: "Do I need to register for A2P 10DLC?",
        a: (
          <p>
            Yes — it&apos;s a US-carrier requirement to send business SMS at
            scale. Settings &gt; SMS compliance walks you through it. Once
            your campaign is approved, paste the IDs there and we&apos;ll
            unlock full sending.
          </p>
        ),
      },
      {
        q: "Can I customize the SMS message?",
        a: (
          <p>
            Yes. Settings &gt; SMS template lets you write your own copy with
            tokens like{" "}
            <code className="font-mono text-sm">{"{{amount}}"}</code> and{" "}
            <code className="font-mono text-sm">{"{{payUrl}}"}</code>.
          </p>
        ),
      },
    ],
  },
  {
    title: "Payments &amp; QuickBooks",
    items: [
      {
        q: "How are payments recorded back to QuickBooks?",
        a: (
          <p>
            When a customer pays through Invoice Chase, we record a Payment
            entity against their open invoices in QuickBooks Online. You can
            verify the link from the Payments page.
          </p>
        ),
      },
      {
        q: "What about refunds?",
        a: (
          <p>
            Full refunds void the QuickBooks Payment. Partial refunds create
            a Refund Receipt — set up the deposit-to account and refund item
            in Settings &gt; Refund accounting once for this to work.
          </p>
        ),
      },
      {
        q: "Why is my dashboard showing old numbers?",
        a: (
          <p>
            We cache QuickBooks data for 60 seconds to keep things fast. Hit{" "}
            <strong>Refresh</strong> on the dashboard to force-pull the latest.
          </p>
        ),
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        q: "How do I add teammates?",
        a: (
          <p>
            Go to Team and invite by email. Choose <strong>Manager</strong>{" "}
            (full access except billing), or <strong>Technician</strong>{" "}
            (mobile fast-pay only).
          </p>
        ),
      },
      {
        q: "Can I cancel any time?",
        a: (
          <p>
            Yes. Billing &gt; Cancel subscription. Your account stays alive
            for the remainder of the period and we keep your data 30 days
            after that for reactivation.
          </p>
        ),
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/changelog"
              className="text-slate-600 hover:text-slate-900"
            >
              Changelog
            </Link>
            <Link
              href="/login"
              className="text-slate-600 hover:text-slate-900"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Help</h1>
        <p className="mt-3 text-sm text-slate-600">
          Quick answers to the questions we hear most. Still stuck? Email{" "}
          <span className="font-mono">support@invoicechase.com</span>.
        </p>
        <div className="mt-10 space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2
                className="text-lg font-semibold text-slate-900"
                dangerouslySetInnerHTML={{ __html: section.title }}
              />
              <dl className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <div
                    key={item.q}
                    className="rounded-xl bg-slate-50 p-5 ring-1 ring-slate-200"
                  >
                    <dt className="font-semibold">{item.q}</dt>
                    <dd className="mt-2 text-sm leading-6 text-slate-600">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
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
