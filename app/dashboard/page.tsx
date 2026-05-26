import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ConnectPrompt } from "@/components/ConnectPrompt";
import { Dashboard } from "@/components/Dashboard";
import {
  OnboardingChecklist,
  type OnboardingStep,
} from "@/components/OnboardingChecklist";
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
                ? `Connect ${supportedSources.join(", ")}. Customers and invoices sync automatically.`
                : "Pull your customers and unpaid invoices automatically.",
            href: "/settings",
            cta: "Connect",
            done: !!qboConn || !!xeroConn || !!jobberConn,
          },
          {
            key: "stripe",
            title: "Connect Stripe to get paid",
            body: "Onboard your Express account so customers can pay via Pay Now and SMS links.",
            href: "/billing",
            cta: "Set up",
            done: canAcceptPayments(connectAccount),
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
          <Dashboard
            companyName={data.companyName}
            customers={data.customers}
            refreshedAt={data.refreshedAt ?? null}
            stale={data.stale ?? false}
          />
        ) : (
          <ConnectPrompt
            error={sp.qbo_error}
            showXero={isXeroConfigured()}
            showJobber={isJobberConfigured()}
          />
        )}
      </main>
    </div>
  );
}
