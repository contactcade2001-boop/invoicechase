import { Link2 } from "lucide-react";

export function ConnectPrompt({ error }: { error?: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center text-center">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
          <Link2 className="h-6 w-6 text-emerald-700" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Connect QuickBooks to see who owes you
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;ll pull your customers and unpaid invoices, show you the
          totals at a glance, and let you collect with one click.
        </p>
        {error ? (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            Connection failed: {error}
          </div>
        ) : null}
        <a
          href="/api/qbo/connect"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2"
        >
          Connect QuickBooks
        </a>
        <p className="mt-3 text-xs text-slate-500">
          Read-only access to customers and invoices.
        </p>
      </div>
    </div>
  );
}
