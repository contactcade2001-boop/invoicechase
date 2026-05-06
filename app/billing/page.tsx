import { ArrowRight, CheckCircle2, CreditCard } from "lucide-react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  getSubscriptionByUserId,
  isActive,
} from "@/lib/server/db/subscriptions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  checkout?: string;
  error?: string;
}>;

const errorMessages: Record<string, string> = {
  checkout_failed: "We couldn't start checkout. Please try again.",
  portal_failed: "We couldn't open the billing portal. Please try again.",
};

function formatRenewal(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sub = getSubscriptionByUserId(user.id);
  const active = isActive(sub);
  const errorMessage = sp.error ? errorMessages[sp.error] : null;
  const justCheckedOut = sp.checkout === "success";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader user={user} current="billing" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>

        {justCheckedOut ? (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Subscription activated. Welcome aboard.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {active ? (
            <>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {sub?.status === "trialing" ? "Trialing" : "Active"}
                </span>
                {sub?.cancelAtPeriodEnd ? (
                  <span className="text-xs text-amber-700">
                    Cancels at period end
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-2xl font-bold">$49 / month</h2>
              <p className="mt-1 text-sm text-slate-600">
                Renews on {formatRenewal(sub?.currentPeriodEnd ?? null)}
              </p>
              <form action="/api/stripe/portal" method="post" className="mt-6">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Manage subscription
                </button>
              </form>
              <p className="mt-3 text-xs text-slate-500">
                Update card, view invoices, or cancel via the Stripe portal.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">Activate your subscription</h2>
              <p className="mt-1 text-sm text-slate-600">
                $49 per month, plus 1.9% per payment collected through Invoice
                Chase. Cancel any time.
              </p>
              <form
                action="/api/stripe/checkout"
                method="post"
                className="mt-6"
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Subscribe with Stripe
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </form>
              <p className="mt-3 text-xs text-slate-500">
                Secure payment via Stripe. We never see your card details.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
