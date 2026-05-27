import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { LienTracker } from "@/components/LienTracker";
import { getCurrentUser } from "@/lib/server/auth/session";
import { listOpenLiens } from "@/lib/server/db/liens";
import { LIEN_DEADLINE_DAYS } from "@/lib/server/liens/states";

export const dynamic = "force-dynamic";

export default async function LiensPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/dashboard");
  const liens = listOpenLiens(user.organizationId!);
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <AppHeader user={user} current="reports" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 lg:px-6">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
            Recovery tool
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-stone-900">
            Mechanics lien tracker.
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Track lien filing deadlines for every unpaid job. Field service
            businesses have a legal right to file mechanics liens — most miss
            the deadline. Per-state windows applied automatically.
          </p>
        </header>
        <LienTracker
          initialLiens={liens.map((l) => ({
            id: l.id,
            customerName: l.customerName,
            jobAddress: l.jobAddress,
            state: l.state,
            invoiceAmountCents: l.invoiceAmountCents,
            filingDeadline: l.filingDeadline,
            lastFurnishDate: l.lastFurnishDate,
          }))}
          stateCodes={Object.keys(LIEN_DEADLINE_DAYS).sort()}
        />
      </main>
    </div>
  );
}
