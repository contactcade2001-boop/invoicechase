import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { CustomerDetail } from "@/components/CustomerDetail";
import { getCurrentUser } from "@/lib/server/auth/session";
import { findActivePayLink } from "@/lib/server/db/payLinks";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { getCustomerDetail } from "@/lib/server/qbo/sync";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function CustomerDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/dashboard");
    redirect("/billing");
  }

  const detail = await getCustomerDetail(orgId, id);
  const activePayLink = findActivePayLink(orgId, id);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader user={user} current="dashboard" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
        {detail.ok ? (
          <CustomerDetail
            customer={detail.customer}
            invoices={detail.invoices}
            payLinkViewedAt={activePayLink?.viewedAt ?? null}
            payLinkViewedCount={activePayLink?.viewedCount ?? 0}
          />
        ) : detail.reason === "not_connected" ? (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
            <h1 className="text-xl font-bold">Not connected</h1>
            <p className="mt-2 text-sm text-slate-600">
              Reconnect QuickBooks from{" "}
              <Link href="/dashboard" className="underline">
                the dashboard
              </Link>
              .
            </p>
          </div>
        ) : (
          notFound()
        )}
      </main>
    </div>
  );
}
