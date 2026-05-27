import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CashflowControlsForm } from "@/components/CashflowControlsForm";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getCashflowConfig } from "@/lib/server/db/cashflow";

export const dynamic = "force-dynamic";

export default async function CashflowSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/dashboard");
  const cfg = getCashflowConfig(user.organizationId!);
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
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
        <CashflowControlsForm config={cfg} />
      </main>
    </div>
  );
}
