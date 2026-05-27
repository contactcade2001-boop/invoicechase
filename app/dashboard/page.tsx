import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import {
  JobberLogo,
  QuickBooksLogo,
  StripeLogo,
  XeroLogo,
} from "@/components/BrandLogos";
import { BehavioralPatternsCard } from "@/components/BehavioralPatternsCard";
import { ChurnRiskCard } from "@/components/ChurnRiskCard";
import { ConnectPrompt } from "@/components/ConnectPrompt";
import { Dashboard } from "@/components/Dashboard";
import { DashboardForecastSnippet } from "@/components/DashboardForecastSnippet";
import {
  OnboardingChecklist,
  type OnboardingStep,
} from "@/components/OnboardingChecklist";
import { PulseScoreCard } from "@/components/PulseScoreCard";
import { TodaysPlaysCard } from "@/components/TodaysPlaysCard";
import { getCurrentUser } from "@/lib/server/auth/session";
import { isJobberConfigured, isXeroConfigured } from "@/lib/server/env";
import {
  canAcceptPayments,
  getConnectAccount,
} from "@/lib/server/db/connect";
import { getConnectionForOrg } from "@/lib/server/db/connections";
import { getJobberConnectionForOrg } from "@/lib/server/db/jobberConnections";
import { listOrgMembers } from "@/lib/server/db/organizations";
import { getXeroConnectionForOrg } from "@/lib/server/db/xeroConnections";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { getBehavioralPatterns } from "@/lib/server/insights/patterns";
import { computeChurnRisk } from "@/lib/server/insights/churnRisk";
import { getTodaysPlays } from "@/lib/server/insights/plays";
import { computePulse } from "@/lib/server/insights/pulse";
import { isOnboarded } from "@/lib/server/db/onboarding";
import { getDashboardData } from "@/lib/server/qbo/sync";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ qbo_error?: string; qbo_connected?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "technician") redirect("/fast-pay");

  const orgId = user.organizationId!;
  const sub = getSubscriptionByOrgId(orgId);
  if (!isActive(sub)) {
    if (user.role !== "owner") redirect("/fast-pay");
    redirect("/billing");
  }
  if (user.role === "owner" && !isOnboarded(orgId)) {
    redirect("/onboarding");
  }

  const data = await getDashboardData(orgId);
  const connectAccount = getConnectAccount(orgId);
  const qboConn = getConnectionForOrg(orgId);
  const xeroConn = getXeroConnectionForOrg(orgId);
  const jobberConn = getJobberConnectionForOrg(orgId);
  const members = listOrgMembers(orgId);

  const supportedSources = [
    "QuickBooks Online",
    isXeroConfigured() ? "Xero" : null,
    isJobberConfigured() ? "Jobber" : null,
  ].filter(Boolean);

  const onboarding: OnboardingStep[] =
    user.role === "owner"
      ? [
          {
            key: "qbo",
            title: "Connect your accounting or FSM",
            body:
              supportedSources.length > 1
                ? `Customers and invoices sync automatically. Pick one — switch any time.`
                : "Pull your customers and unpaid invoices automatically.",
            href: "/settings",
            cta: "Connect",
            done: !!qboConn || !!xeroConn || !!jobberConn,
            badge: (
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <QuickBooksLogo size={14} /> QuickBooks
                </span>
                {isXeroConfigured() ? (
                  <span className="inline-flex items-center gap-1">
                    <XeroLogo size={14} /> Xero
                  </span>
                ) : null}
                {isJobberConfigured() ? (
                  <span className="inline-flex items-center gap-1">
                    <JobberLogo size={14} /> Jobber
                  </span>
                ) : null}
              </div>
            ),
          },
          {
            key: "stripe",
            title: "Connect Stripe to get paid",
            body: "Onboard your Express account so customers can pay via Pay Now and SMS links.",
            href: "/billing",
            cta: "Set up",
            done: canAcceptPayments(connectAccount),
            badge: (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <StripeLogo size={14} /> Stripe Connect
              </span>
            ),
          },
          {
            key: "team",
            title: "Invite teammates (optional)",
            body: "Add managers or technicians so the office and field share the workload.",
            href: "/team",
            cta: "Invite",
            done: members.length > 1,
          },
        ]
      : [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader user={user} current="dashboard" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:py-10">
        {onboarding.length > 0 ? (
          <OnboardingChecklist steps={onboarding} />
        ) : null}
        {data.connected ? (
          <>
            <Dashboard
              companyName={data.companyName}
              customers={data.customers}
              refreshedAt={data.refreshedAt ?? null}
              stale={data.stale ?? false}
              source={
                qboConn ? "qbo" : xeroConn ? "xero" : jobberConn ? "jobber" : null
              }
              pulseSlot={<PulseScoreCard pulse={computePulse(data.customers)} />}
              playsSlot={
                <TodaysPlaysCard
                  result={await getTodaysPlays(orgId, data.customers)}
                />
              }
              patternsSlot={
                <BehavioralPatternsCard
                  result={await getBehavioralPatterns(
                    orgId,
                    data.customers,
                  )}
                />
              }
            />
            <ChurnRiskCard result={computeChurnRisk(data.customers)} />
            <DashboardForecastSnippet organizationId={orgId} />
          </>
        ) : (
          <ConnectPrompt
            error={sp.qbo_error}
            showXero={isXeroConfigured()}
            showJobber={isJobberConfigured()}
            canConnect={user.role === "owner"}
          />
        )}
      </main>
    </div>
  );
}
