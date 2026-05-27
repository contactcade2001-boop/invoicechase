import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CashflowControlsForm } from "@/components/CashflowControlsForm";
import { PlaidConnectButton } from "@/components/PlaidConnectButton";
import { RelationshipControlsForm } from "@/components/RelationshipControlsForm";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getCashflowConfig } from "@/lib/server/db/cashflow";
import { isPlaidConfigured } from "@/lib/server/plaid/client";
import { getPlaidConnection } from "@/lib/server/plaid/repo";

export const dynamic = "force-dynamic";

export default async function CashflowSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/dashboard");
  const cfg = getCashflowConfig(user.organizationId!);
  const plaidConn = getPlaidConnection(user.organizationId!);
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} current="settings" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 lg:px-6">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
            Cashflow controls
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-stone-900">
            Get paid sooner, lose less to bad debt.
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Every lever here is engineered to compress your DSO. Flip what
            applies to your business — defaults are safe.
          </p>
        </header>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Bank connection
          </p>
          <h2 className="font-display mt-1 text-lg font-semibold text-stone-900">
            Live cash on hand via Plaid
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Securely connect your business bank account. We pull the balance
            every few minutes so the runway widget and forecast stay accurate.
          </p>
          <div className="mt-4">
            <PlaidConnectButton
              connected={!!plaidConn}
              institutionName={plaidConn?.institutionName ?? null}
              balanceCents={plaidConn?.bankBalanceCents ?? cfg.bankBalanceCents}
              refreshedAt={
                plaidConn?.bankBalanceRefreshedAt ?? cfg.bankBalanceRefreshedAt
              }
              configured={isPlaidConfigured()}
            />
          </div>
        </section>

        <CashflowControlsForm config={cfg} />

        <div className="mt-12">
          <header className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
              Relationship & control
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold text-stone-900">
              Stay on-brand. Stay in control.
            </h2>
          </header>
          <RelationshipControlsForm config={cfg} />
        </div>
      </main>
    </div>
  );
}
