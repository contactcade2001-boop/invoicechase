import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Invoice Chase",
  description:
    "Terms governing use of the Invoice Chase service.",
};

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Acceptance",
    body: (
      <p>
        By creating an account or using the Invoice Chase service
        (the &ldquo;Service&rdquo;), you agree to these terms. If you don&apos;t
        agree, don&apos;t use the Service.
      </p>
    ),
  },
  {
    title: "What we provide",
    body: (
      <p>
        Invoice Chase is a tool for QuickBooks-using businesses to view
        outstanding invoices, send invoice-reminder text messages, and accept
        payments via Stripe Checkout. The Service depends on third-party APIs
        (Intuit/QuickBooks, Stripe, Twilio, Anthropic, Resend) and we cannot
        guarantee 100% availability.
      </p>
    ),
  },
  {
    title: "Your account",
    body: (
      <ul className="ml-5 list-disc space-y-1">
        <li>You must be the business owner or an authorized employee.</li>
        <li>Keep your login email secure. You are responsible for actions taken from your account.</li>
        <li>
          You may invite teammates with the &ldquo;manager&rdquo; or
          &ldquo;technician&rdquo; roles. You are responsible for what they do
          on your account.
        </li>
      </ul>
    ),
  },
  {
    title: "Subscription and fees",
    body: (
      <ul className="ml-5 list-disc space-y-1">
        <li>The base subscription is $49/month, billed in advance.</li>
        <li>
          A platform fee of 1.9% applies to each successful payment collected
          through Invoice Chase. Stripe&apos;s standard processing fees apply
          separately.
        </li>
        <li>You can cancel any time. Subscription fees are non-refundable.</li>
      </ul>
    ),
  },
  {
    title: "Acceptable use of SMS",
    body: (
      <p>
        You agree to use Invoice Chase&apos;s SMS features only to communicate
        with customers about their invoices, payments, and your business
        relationship with them. You must not send marketing or promotional
        messages without separate, documented consent. You will honor STOP
        replies. You will not use the Service to send unlawful, harassing, or
        deceptive messages. We may suspend the Service if we believe it is
        being used in violation of carrier rules (TCPA, CTIA guidelines) or
        Twilio&apos;s acceptable-use policy.
      </p>
    ),
  },
  {
    title: "QuickBooks data",
    body: (
      <p>
        You represent that you have the right to grant Invoice Chase access to
        your QuickBooks Online company file. We will read customers, invoices,
        and payments, and we will write back payment and refund records when
        money moves through Invoice Chase. We will not modify your data
        otherwise.
      </p>
    ),
  },
  {
    title: "Customer data",
    body: (
      <p>
        You represent that you have a legitimate business relationship with the
        customers in your QuickBooks file and that you have the right to
        contact them at the phone numbers and email addresses on record about
        their invoices.
      </p>
    ),
  },
  {
    title: "Service availability",
    body: (
      <p>
        We aim for high availability but provide the Service &ldquo;as
        is&rdquo;. We don&apos;t warrant uninterrupted operation. We are not
        liable for indirect, incidental, or consequential damages, and our
        aggregate liability for any claim is limited to the fees you paid us
        in the prior twelve months.
      </p>
    ),
  },
  {
    title: "Termination",
    body: (
      <p>
        You can cancel your subscription at any time from /billing. We may
        terminate or suspend access for breach of these terms, non-payment, or
        misuse. Upon termination, your access ends and we will delete your
        data per the retention schedule in our Privacy Policy.
      </p>
    ),
  },
  {
    title: "Changes",
    body: (
      <p>
        We may update these terms. Material changes will be announced by email
        to the address on file at least 14 days before they take effect.
      </p>
    ),
  },
  {
    title: "Contact",
    body: (
      <p>
        Questions? Email{" "}
        <span className="font-mono">support@invoicechase.com</span>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="text-slate-600 hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: May 6, 2026
        </p>
        <div className="mt-10 space-y-8 text-sm leading-6 text-slate-700">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-900">
                {section.title}
              </h2>
              <div className="mt-2 space-y-3">{section.body}</div>
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
