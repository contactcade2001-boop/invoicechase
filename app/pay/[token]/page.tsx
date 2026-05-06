import { CheckCircle2, CreditCard, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { canAcceptPayments, getConnectAccount } from "@/lib/server/db/connect";
import { findPayLinkByToken } from "@/lib/server/db/payLinks";
import { lookupCustomerForOrg } from "@/lib/server/qbo/sync";
import { formatCurrencyDetailed } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pay your invoice",
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;
type SearchParams = Promise<{ paid?: string; error?: string }>;

const errorMessages: Record<string, string> = {
  start_failed: "We couldn't start checkout. Please try again.",
};

function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="py-6 text-center text-xs text-slate-500">
        Powered by Invoice Chase
      </footer>
    </div>
  );
}

function MessageCard({
  title,
  body,
  tone = "neutral",
  icon,
}: {
  title: string;
  body: string;
  tone?: "neutral" | "success";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      {icon ? (
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ring-1 ${
            tone === "success"
              ? "bg-emerald-50 ring-emerald-200"
              : "bg-slate-100 ring-slate-200"
          }`}
        >
          {icon}
        </div>
      ) : null}
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { token } = await params;
  const sp = await searchParams;

  if (sp.paid === "1") {
    return (
      <PageShell>
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
            <CheckCircle2
              className="h-6 w-6 text-emerald-700"
              aria-hidden
            />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Payment received</h1>
          <p className="mt-2 text-sm text-slate-600">
            Thanks. Your payment has been processed.
          </p>
          <Link
            href="/portal"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 underline-offset-2 hover:underline"
          >
            View your payment history →
          </Link>
        </div>
      </PageShell>
    );
  }

  const link = findPayLinkByToken(token);
  if (!link) {
    return (
      <PageShell>
        <MessageCard
          title="Link not found"
          body="This payment link is invalid. Ask the business that texted you for a new one."
        />
      </PageShell>
    );
  }
  if (link.expiresAt < Date.now()) {
    return (
      <PageShell>
        <MessageCard
          title="Link expired"
          body="This payment link has expired. Ask the business that texted you for a fresh one."
        />
      </PageShell>
    );
  }

  const lookup = await lookupCustomerForOrg(
    link.organizationId,
    link.customerId,
  );
  if (!lookup.ok) {
    const body =
      lookup.reason === "not_connected"
        ? "The business has temporarily disconnected their accounting. Please reach out to them directly."
        : "We couldn't find this customer record. Please reach out to the business directly.";
    return (
      <PageShell>
        <MessageCard title="Payment unavailable" body={body} />
      </PageShell>
    );
  }

  const { customer, companyName } = lookup;
  const isDeposit = link.amountCentsOverride != null;
  const displayAmountCents = isDeposit
    ? link.amountCentsOverride!
    : customer.amountOwed;

  if (!isDeposit && customer.amountOwed <= 0) {
    return (
      <PageShell>
        <MessageCard
          tone="success"
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-700" aria-hidden />}
          title="Paid in full"
          body={`There's nothing outstanding on your account with ${companyName}.`}
        />
      </PageShell>
    );
  }

  const connectAccount = getConnectAccount(link.organizationId);
  if (!canAcceptPayments(connectAccount)) {
    return (
      <PageShell>
        <MessageCard
          title="Payments not yet enabled"
          body={`${companyName} is finalizing their payment setup. Check back soon, or reach out to them directly.`}
        />
      </PageShell>
    );
  }

  const errorMessage = sp.error ? errorMessages[sp.error] : null;

  return (
    <PageShell>
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {companyName}
        </p>
        <h1 className="mt-2 text-2xl font-bold">
          {isDeposit ? "Pay your deposit" : "Pay your invoice"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{customer.name}</p>

        <div className="mt-6 rounded-xl bg-slate-50 p-5 ring-1 ring-slate-200">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {isDeposit ? "Deposit due" : "Amount due"}
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
            {formatCurrencyDetailed(displayAmountCents)}
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {errorMessage}
          </div>
        ) : null}

        <form action={`/api/pay/${token}/checkout`} method="post" className="mt-6">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <CreditCard className="h-5 w-5" aria-hidden />
            Pay with card
          </button>
        </form>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <Lock className="h-3 w-3" aria-hidden />
          Secure payment via Stripe
        </p>
      </div>
    </PageShell>
  );
}
