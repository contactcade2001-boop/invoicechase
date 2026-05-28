import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { StripeLogo } from "@/components/BrandLogos";
import { CopyReferralLink } from "@/components/CopyReferralLink";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  canAcceptPayments,
  getConnectAccount,
} from "@/lib/server/db/connect";
import {
  getOrgById,
  setOrgCustomerReferralCode,
} from "@/lib/server/db/organizations";
import { listOrgReferralsForOrg } from "@/lib/server/db/orgReferrals";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { getAppBaseUrl } from "@/lib/server/env";
import { generateUniqueOrgReferralCode } from "@/lib/server/partners/code";
import { refreshConnectStatus } from "@/lib/server/stripe/connect";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  checkout?: string;
  connect?: string;
  error?: string;
}>;

const errorMessages: Record<string, string> = {
  checkout_failed: "We couldn't start checkout. Please try again.",
  portal_failed: "We couldn't open the billing portal. Please try again.",
  connect_failed: "We couldn't start Stripe Connect onboarding. Please try again.",
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
  if (user.role !== "owner") redirect("/dashboard");

  const orgId = user.organizationId!;

  // After returning from Stripe-hosted onboarding, pull the latest account state
  // so the UI reflects charges_enabled etc. immediately rather than waiting for
  // the account.updated webhook.
  if (sp.connect === "return") {
    const acct = getConnectAccount(orgId);
    if (acct) {
      try {
        await refreshConnectStatus(orgId, acct.stripeAccountId);
      } catch (err) {
        console.error("[stripe-connect] refresh failed", err);
      }
    }
  }

  const sub = getSubscriptionByOrgId(orgId);
  const subActive = isActive(sub);
  const connectAccount = getConnectAccount(orgId);
  const acceptsPayments = canAcceptPayments(connectAccount);
  const errorMessage = sp.error ? errorMessages[sp.error] : null;
  const justCheckedOut = sp.checkout === "success";

  // Lazily mint a customer-referral code on first /billing visit so existing
  // orgs get a code without needing an explicit migration.
  let org = getOrgById(orgId)!;
  if (!org.customerReferralCode) {
    const { findOrgByCustomerReferralCode } = await import(
      "@/lib/server/db/organizations"
    );
    const fresh = generateUniqueOrgReferralCode(
      (c) => !!findOrgByCustomerReferralCode(c),
    );
    setOrgCustomerReferralCode(orgId, fresh);
    org = { ...org, customerReferralCode: fresh };
  }
  const orgReferrals = listOrgReferralsForOrg(orgId);
  const referralUrl = `${getAppBaseUrl()}/r/biz/${org.customerReferralCode}`;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} current="billing" />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>

        {justCheckedOut ? (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Subscription activated. Welcome aboard.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {errorMessage}
          </div>
        ) : null}

        {/* Subscription card */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Subscription
          </h2>
          {subActive ? (
            <>
              <div className="mt-2 flex items-center gap-2">
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
              <h3 className="mt-3 text-2xl font-bold">$49 / month</h3>
              <p className="mt-1 text-sm text-stone-600">
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
            </>
          ) : (
            <>
              <h3 className="mt-2 text-xl font-bold">
                Activate your subscription
              </h3>
              <p className="mt-1 text-sm text-stone-600">
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
            </>
          )}
        </section>

        {/* Connect / Accept payments card */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Accept payments
          </h2>

          {acceptsPayments ? (
            <>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Stripe connected
                </span>
                {connectAccount?.payoutsEnabled !== 1 ? (
                  <span className="text-xs text-amber-700">
                    Payouts pending verification
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-stone-600">
                Customers can pay via your Stripe account. Invoice Chase keeps
                1.9% of each payment as a platform fee.
              </p>
              <form action="/api/stripe/connect" method="post" className="mt-6">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-inset ring-stone-300 transition hover:bg-white"
                >
                  <StripeLogo size={16} />
                  Update Stripe details
                </button>
              </form>
            </>
          ) : (
            <>
              <h3 className="mt-2 text-xl font-bold">
                Connect Stripe to get paid
              </h3>
              <p className="mt-1 text-sm text-stone-600">
                Onboard with Stripe (about 5 minutes) so customers can pay via
                Pay Now and SMS payment links. Funds land in your bank account;
                we collect a 1.9% platform fee on each payment.
              </p>
              <form action="/api/stripe/connect" method="post" className="mt-6">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <StripeLogo size={18} />
                  {connectAccount
                    ? "Continue Stripe onboarding"
                    : "Connect Stripe"}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-lg font-semibold tracking-tight">
            Refer another business
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Know another QuickBooks-using SMB? Send them this link. When they
            subscribe, you both get a free month.
          </p>
          <div className="mt-4">
            <CopyReferralLink url={referralUrl} />
          </div>
          <p className="mt-3 text-xs text-stone-500">
            {orgReferrals.length === 0
              ? "No referrals yet."
              : `${orgReferrals.length} business${orgReferrals.length === 1 ? "" : "es"} referred · ${orgReferrals.filter((r) => r.creditStatus === "credited").length} credited.`}
          </p>
        </section>
      </main>
    </div>
  );
}
