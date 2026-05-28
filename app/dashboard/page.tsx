import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ActivityFeed } from "@/components/dashboard-v2/ActivityFeed";
import { HeroMetrics } from "@/components/dashboard-v2/HeroMetrics";
import { OverdueSection } from "@/components/dashboard-v2/OverdueSection";
import { TrendChart } from "@/components/dashboard-v2/TrendChart";
import { getCurrentUser } from "@/lib/server/auth/session";
import { isOnboarded } from "@/lib/server/db/onboarding";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { getDashboardData } from "@/lib/dashboard/data";
import type { Period } from "@/lib/dashboard/types";

export const dynamic = "force-dynamic";

function parsePeriod(raw: string | undefined): Period {
  return raw === "month" || raw === "quarter" ? raw : "week";
}

type SearchParams = Promise<{ period?: string; qbo_connected?: string }>;

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
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/fast-pay");
    redirect("/billing");
  }
  if (user.role === "owner" && !isOnboarded(orgId)) {
    redirect("/onboarding");
  }

  const period = parsePeriod(sp.period);
  const data = await getDashboardData({ organizationId: orgId, period });

  return (
    <div className="min-h-screen bg-mk-ink-50 text-mk-ink-700">
      <AppHeader user={user} current="dashboard" />
      <main className="mx-auto w-full max-w-[1120px] px-5 py-8 sm:px-8 sm:py-10">
        {data.isMock ? (
          <div className="mb-5 rounded-mk-md bg-mk-primary-50 px-4 py-3 text-[12px] text-mk-primary-700 ring-1 ring-inset ring-mk-primary-100">
            <strong>Sample data.</strong> Connect QuickBooks to see your
            real numbers here.
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
          <div className="space-y-5 lg:col-span-2">
            <HeroMetrics
              period={period}
              collected={data.collected}
              dso={data.dso}
            />
          </div>

          <div className="space-y-5">
            <OverdueSection overdue={data.overdue} />
            <ActivityFeed items={data.activity} />
          </div>

          <div className="space-y-5">
            <TrendChart data={data.trend} />
          </div>
        </div>
      </main>
    </div>
  );
}
