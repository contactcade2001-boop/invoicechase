import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  sent?: string;
  email?: string;
  error?: string;
}>;

const errorMessages: Record<string, string> = {
  missing_email: "Please enter your email address.",
  invalid_email: "That email address doesn't look right.",
  expired_link: "Your magic link expired. Send a fresh one below.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const sent = sp.sent === "1";
  const errorMessage = sp.error ? errorMessages[sp.error] : null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                <Mail className="h-6 w-6 text-emerald-700" aria-hidden />
              </div>
              <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
              <p className="mt-2 text-sm text-slate-600">
                We sent a sign-in link to{" "}
                <span className="font-semibold text-slate-900">
                  {sp.email ?? "your inbox"}
                </span>
                . Click it to log in.
              </p>
              <p className="mt-4 text-xs text-slate-500">
                Don&apos;t see it? Check spam, or use a different email.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm font-semibold text-slate-700 underline-offset-2 hover:underline"
              >
                ← Back
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Sign in</h1>
              <p className="mt-1 text-sm text-slate-600">
                We&apos;ll email you a one-time link. No password needed.
              </p>
              {errorMessage ? (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                  {errorMessage}
                </div>
              ) : null}
              <form
                action="/api/auth/request"
                method="post"
                className="mt-6 space-y-3"
              >
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Email
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="you@business.com"
                    className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Send magic link
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
