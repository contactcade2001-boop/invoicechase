import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center text-stone-900">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-stone-600">
        The page you&apos;re looking for moved, was renamed, or never existed.
        If you got here from an invoice reminder, your business probably has
        a fresh link waiting.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          Go home
        </Link>
        <Link
          href="/help"
          className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-white"
        >
          Help center
        </Link>
      </div>
    </div>
  );
}
