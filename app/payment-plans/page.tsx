import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  listInstallmentsForPlan,
  listPaymentPlansForOrg,
} from "@/lib/server/db/paymentPlans";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { getAppBaseUrl } from "@/lib/server/env";
import { formatCurrencyDetailed } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment plans — Invoice Chase" };

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-slate-100 text-stone-700 ring-stone-200",
};

function StatusPill({ status }: { status: string }) {
  const cls =
    STATUS_CLASSES[status] ?? "bg-slate-100 text-stone-700 ring-stone-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}

export default async function PaymentPlansPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "technician") redirect("/dashboard");
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/dashboard");
    redirect("/billing");
  }

  const plans = listPaymentPlansForOrg(orgId);
  const baseUrl = getAppBaseUrl();
  const enriched = plans.map((p) => ({
    plan: p,
    installments: listInstallmentsForPlan(p.id),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} current="payments" />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Payment plans</h1>
        <p className="text-sm text-stone-600">
          Split a balance into a sequence of fixed installments. Each one gets
          its own pay link you can text or email.
        </p>

        {enriched.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-stone-200">
            <Inbox className="mx-auto h-8 w-8 text-stone-500" aria-hidden />
            <h3 className="mt-3 text-sm font-semibold">No plans yet</h3>
            <p className="mt-1 text-sm text-stone-500">
              Open a customer&apos;s detail page and click{" "}
              <strong>New payment plan</strong>.
            </p>
          </div>
        ) : (
          enriched.map(({ plan, installments }) => {
            const paid = installments.filter((i) => i.status === "paid").length;
            return (
              <section
                key={plan.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200"
              >
                <div className="flex items-center justify-between gap-4 border-b border-stone-200 bg-white px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {plan.customerName ?? "Customer"} ·{" "}
                      {formatCurrencyDetailed(plan.totalCents)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {plan.installmentCount} installments · every{" "}
                      {plan.frequencyDays} days · {paid}/{plan.installmentCount}{" "}
                      paid
                    </p>
                  </div>
                  <StatusPill status={plan.status} />
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      <th className="px-5 py-3 text-left">#</th>
                      <th className="px-5 py-3 text-left">Due</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-right">Pay link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((inst) => (
                      <tr
                        key={inst.id}
                        className="border-b border-stone-100 last:border-b-0"
                      >
                        <td className="px-5 py-3 text-stone-500">
                          {inst.sequence}
                        </td>
                        <td className="px-5 py-3 text-stone-700">
                          {inst.dueDate}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums">
                          {formatCurrencyDetailed(inst.amountCents)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusPill status={inst.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          {inst.payLinkToken ? (
                            <a
                              href={`${baseUrl}/pay/${inst.payLinkToken}`}
                              target="_blank"
                              rel="noopener"
                              className="font-mono text-xs text-stone-600 underline-offset-2 hover:underline"
                            >
                              /pay/{inst.payLinkToken.slice(0, 6)}…
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
