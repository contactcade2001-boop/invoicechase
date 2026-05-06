import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ConnectPrompt } from "@/components/ConnectPrompt";
import { Dashboard } from "@/components/Dashboard";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  getSubscriptionByUserId,
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

  const sub = getSubscriptionByUserId(user.id);
  if (!isActive(sub)) redirect("/billing");

  const data = await getDashboardData(user.id);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader user={user} current="dashboard" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:py-10">
        {data.connected ? (
          <Dashboard
            companyName={data.companyName}
            customers={data.customers}
          />
        ) : (
          <ConnectPrompt error={sp.qbo_error} />
        )}
      </main>
    </div>
  );
}
