import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { isGoogleConfigured } from "@/lib/server/auth/google";
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
  google_not_configured: "Google sign-in isn't enabled yet.",
  google_denied: "Google sign-in was cancelled.",
  google_missing_code: "Google sign-in didn't complete. Try again.",
  google_bad_state: "Sign-in attempt expired. Try again.",
  google_unverified_email: "Verify your Google email first, then try again.",
  google_failed: "Google sign-in failed. Try again or use email.",
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
  const googleOn = isGoogleConfigured();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size={20} />
            <span className="font-display text-base font-bold tracking-tight text-stone-900">
              Invoice Chase<span className="text-orange-600">.</span>
            </span>
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
              <h1 className="font-display text-2xl font-bold">Sign in</h1>
              <p className="mt-1 text-sm text-slate-600">
                One click with Google — no email check required.
              </p>
              {errorMessage ? (
                <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                  {errorMessage}
                </div>
              ) : null}

              {googleOn ? (
                <a
                  href="/api/auth/google/start"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 hover:ring-slate-400 hover:shadow"
                >
                  <GoogleGlyph />
                  Continue with Google
                </a>
              ) : null}

              {googleOn ? (
                <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  or email a magic link
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              ) : null}

              <form
                action="/api/auth/request"
                method="post"
                className={googleOn ? "space-y-3" : "mt-6 space-y-3"}
              >
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Email
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    autoFocus={!googleOn}
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

function GoogleGlyph() {
  return (
    <svg
      viewBox="0 0 18 18"
      className="h-4 w-4"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
