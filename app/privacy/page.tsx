import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Invoice Chase",
  description:
    "How Invoice Chase collects, uses, and protects your business and customer data.",
};

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Who we are",
    body: (
      <p>
        Invoice Chase (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a software service
        that helps small businesses see who owes them money and collect with
        SMS reminders and Stripe payment links. This policy explains what we
        collect, how we use it, and your choices.
      </p>
    ),
  },
  {
    title: "What we collect",
    body: (
      <ul className="ml-5 list-disc space-y-1">
        <li>
          <span className="font-medium">Merchant account data:</span> the email
          address you sign in with, your business name, and your role on the
          team.
        </li>
        <li>
          <span className="font-medium">Accounting data via QuickBooks:</span>{" "}
          when you connect your QuickBooks Online account, we read customers,
          invoices, and payment records so we can show what&apos;s owed and post
          payments back. We never write to your QuickBooks data outside of
          recording payments and refund receipts.
        </li>
        <li>
          <span className="font-medium">Customer contact info:</span> names,
          phone numbers, and email addresses already present on your QuickBooks
          customers, used to send invoice reminders and receipts on your
          behalf.
        </li>
        <li>
          <span className="font-medium">SMS metadata:</span> message content,
          delivery status, and replies for conversations sent through Invoice
          Chase. We retain this so you can see the thread later.
        </li>
        <li>
          <span className="font-medium">Payment metadata:</span> we receive
          amounts, customer email/name, and payment IDs from Stripe Checkout
          and webhooks. We never receive or store full card numbers.
        </li>
      </ul>
    ),
  },
  {
    title: "How we use it",
    body: (
      <ul className="ml-5 list-disc space-y-1">
        <li>To show you a dashboard of who owes you and how much.</li>
        <li>
          To send invoice-reminder texts and pay-link emails on your behalf,
          and to power the optional autopilot SMS replies.
        </li>
        <li>
          To record payments and partial refunds back to your QuickBooks file.
        </li>
        <li>
          To send you product, billing, and security communications about your
          account.
        </li>
      </ul>
    ),
  },
  {
    title: "How we share it",
    body: (
      <p>
        We share data only with service providers we use to run the product:
        Twilio (SMS delivery), Stripe (payments and subscription billing),
        Anthropic (AI replies, when you enable autopilot), Resend (email), and
        Intuit / QuickBooks (read + payment write-back). Each receives only
        the data needed to perform its function. We do not sell your data and
        do not share it for advertising.
      </p>
    ),
  },
  {
    title: "SMS and opt-out",
    body: (
      <p>
        When you send a text from Invoice Chase, the recipient can reply STOP
        at any time to opt out, HELP for instructions, or START to opt back
        in. We honor STOP per business and per phone number — once a customer
        opts out of your messages, we will block further sends from your
        Invoice Chase account to that number until they reply START.
      </p>
    ),
  },
  {
    title: "Data retention",
    body: (
      <ul className="ml-5 list-disc space-y-1">
        <li>SMS conversations are retained for the life of your account.</li>
        <li>
          Webhook delivery records are pruned after 30 days; audit logs after
          90 days.
        </li>
        <li>
          When you disconnect QuickBooks, we revoke our token and stop syncing.
          Cached customer + invoice data is removed on disconnect.
        </li>
        <li>
          When you cancel your subscription, we keep your account data for 30
          days to allow reactivation, then delete on request.
        </li>
      </ul>
    ),
  },
  {
    title: "Your choices",
    body: (
      <ul className="ml-5 list-disc space-y-1">
        <li>Disconnect QuickBooks any time from /settings.</li>
        <li>Cancel your subscription any time from /billing.</li>
        <li>
          Email <span className="font-mono">privacy@invoicechase.com</span> to
          request deletion of your account data.
        </li>
      </ul>
    ),
  },
  {
    title: "Changes",
    body: (
      <p>
        We may update this policy as the product changes. Material changes
        will be communicated by email to the address on file.
      </p>
    ),
  },
  {
    title: "Contact",
    body: (
      <p>
        Questions? Email{" "}
        <span className="font-mono">privacy@invoicechase.com</span>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-900/70 text-stone-100">
      <header className="border-b border-stone-800 bg-stone-900/70">
        <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/terms" className="text-stone-400 hover:text-stone-100">
              Terms
            </Link>
            <Link href="/login" className="text-stone-400 hover:text-stone-100">
              Sign in
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Last updated: May 6, 2026
        </p>
        <div className="mt-10 space-y-8 text-sm leading-6 text-stone-300">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-stone-100">
                {section.title}
              </h2>
              <div className="mt-2 space-y-3">{section.body}</div>
            </section>
          ))}
        </div>
      </main>
      <footer className="border-t border-stone-800 bg-stone-900/70 py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 text-sm text-stone-500">
          <span className="font-semibold text-stone-300">Invoice Chase</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-stone-100">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-stone-100">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
