import { redirect } from "next/navigation";
import Link from "next/link";
import { Banknote, ExternalLink, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  findPartnerByUserId,
  listCommissionsForPartner,
  listReferralsForPartner,
  partnerEarningsSummary,
} from "@/lib/server/db/partners";
import { getOrgById } from "@/lib/server/db/organizations";
import { getSubscriptionByOrgId } from "@/lib/server/db/subscriptions";
import { getAppBaseUrl } from "@/lib/server/env";
import { formatCurrencyDetailed } from "@/lib/format";
import { formatRelativeTime } from "@/lib/inboxFormat";
import { CopyReferralLink } from "@/components/CopyReferralLink";
import { MarkPaidButton } from "@/components/MarkPaidButton";
import { PartnerStripeOnboard } from "@/components/PartnerStripeOnboard";
import { TransferCommissionButton } from "@/components/TransferCommissionButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Partner dashboard — Invoice Chase",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}

export default async function PartnerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/partner");

  const partner = findPartnerByUserId(user.id);
  if (!partner) redirect("/partners/apply");

  const referrals = listReferralsForPartner(partner.id);
  const commissions = listCommissionsForPartner(partner.id);
  const earnings = partnerEarningsSummary(partner.id);
  const referralUrl = `${getAppBaseUrl()}/r/${partner.referralCode}`;

  // Hydrate per-referral display info
  const enrichedReferrals = referrals.map((r) => {
    const org = getOrgById(r.organizationId);
    const sub = getSubscriptionByOrgId(r.organizationId);
    return {
      ...r,
      orgName: org?.name ?? `Org #${r.organizationId}`,
      subscriptionStatus: sub?.status ?? "no_subscription",
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd === 1,
    };
  });

  const activeReferrals = enrichedReferrals.filter(
    (r) =>
      r.subscriptionStatus === "active" || r.subscriptionStatus === "trialing",
  ).length;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-slate-600 sm:inline">{user.email}</span>
            <Link
              href="/partners"
              className="text-slate-500 hover:text-slate-900"
            >
              Program info
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Partner dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {partner.displayName ?? user.email}
          </h1>
          {partner.companyName ? (
            <p className="mt-1 text-sm text-slate-500">{partner.companyName}</p>
          ) : null}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Users className="h-3.5 w-3.5" aria-hidden /> Referrals
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {referrals.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {activeReferrals} active subscription
              {activeReferrals === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Banknote className="h-3.5 w-3.5" aria-hidden /> Pending payout
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {formatCurrencyDetailed(earnings.pendingCents)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              At {(partner.commissionPercentBps / 100).toFixed(0)}% commission
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Banknote className="h-3.5 w-3.5" aria-hidden /> Lifetime earned
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {formatCurrencyDetailed(earnings.lifetimeCents)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatCurrencyDetailed(earnings.paidCents)} paid out
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold tracking-tight">
            Stripe payouts
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {partner.stripeAccountId
              ? "Connected. Use the Transfer button on a pending commission to push it to your bank via Stripe."
              : "Connect a Stripe Express account so we can wire your monthly commissions automatically. Until you do, you can still self-acknowledge off-platform payouts."}
          </p>
          <div className="mt-4">
            <PartnerStripeOnboard
              connected={!!partner.stripeAccountId}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold tracking-tight">
            Your referral link
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Share this link with QuickBooks-using SMBs you work with. Anyone
            who signs up within 30 days of clicking is attributed to you.
          </p>
          <div className="mt-4">
            <CopyReferralLink url={referralUrl} />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Hand-out:{" "}
            <Link
              href="/partners"
              className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
            >
              one-page partner overview
              <ExternalLink className="h-3 w-3" aria-hidden />
            </Link>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">
            Referred customers
          </h2>
          {enrichedReferrals.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <Users
                className="mx-auto h-8 w-8 text-slate-400"
                aria-hidden
              />
              <h3 className="mt-3 text-sm font-semibold">No referrals yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Share your link with a QuickBooks-using SMB to get started.
              </p>
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Joined</th>
                    <th className="px-4 py-3 text-left">Subscription</th>
                    <th className="px-4 py-3 text-left">First paid</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedReferrals.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {r.orgName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatRelativeTime(r.attributedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.subscriptionStatus} />
                        {r.cancelAtPeriodEnd ? (
                          <span className="ml-2 text-xs text-slate-500">
                            cancelling
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.firstPaidAt
                          ? formatRelativeTime(r.firstPaidAt)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Commissions</h2>
          {commissions.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              We&apos;ll record your monthly commissions here as soon as your
              referrals start paying.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 text-left">Period</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-right">Basis</th>
                    <th className="px-4 py-3 text-right">Earned</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-4 py-3 text-slate-700">
                        {new Date(c.periodStart).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.source === "subscription"
                          ? "Subscription"
                          : "Platform fees"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                        {formatCurrencyDetailed(c.basisCents)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">
                        {formatCurrencyDetailed(c.commissionCents)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <StatusBadge status={c.status} />
                          {c.status === "pending" ? (
                            partner.stripeAccountId ? (
                              <TransferCommissionButton
                                commissionId={c.id}
                                enabled={true}
                              />
                            ) : (
                              <MarkPaidButton commissionId={c.id} />
                            )
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Payouts are issued monthly to <span className="font-mono">{partner.payoutEmail ?? user.email}</span>. Once you receive a payout, hit &ldquo;Mark paid&rdquo; with the reference number.
          </p>
        </section>
      </main>
    </div>
  );
}
