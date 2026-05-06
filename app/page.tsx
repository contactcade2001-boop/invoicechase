import { ConnectPrompt } from "@/components/ConnectPrompt";
import { Dashboard } from "@/components/Dashboard";
import { getDashboardData } from "@/lib/server/qbo/sync";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ qbo_error?: string; qbo_connected?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const data = await getDashboardData();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8 sm:py-12">
      {data.connected ? (
        <Dashboard
          companyName={data.companyName}
          customers={data.customers}
        />
      ) : (
        <ConnectPrompt error={sp.qbo_error} />
      )}
    </main>
  );
}
