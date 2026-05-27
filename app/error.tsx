"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Best-effort console logging — Sentry already captures via the
    // server-side observability wrapper when configured.
    console.error("[ui]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center text-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
        Something broke
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        That didn&apos;t work
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
        We&apos;ve been notified. You can retry the action or head back to
        the dashboard.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-slate-400">
          ref: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
