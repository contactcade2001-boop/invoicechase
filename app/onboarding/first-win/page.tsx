import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { FirstWinReview } from "@/components/FirstWinReview";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getBatchForOrg } from "@/lib/server/db/onboardingBatches";
import { buildFirstWinPreview } from "@/lib/server/onboarding/firstWinBatch";

export const dynamic = "force-dynamic";

export default async function FirstWinPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/dashboard");
  const orgId = user.organizationId!;

  // If they've already approved a batch, send them to the dashboard so
  // they can watch sends progress — this page is single-purpose.
  const existing = getBatchForOrg(orgId);
  if (
    existing &&
    (existing.status === "approved" ||
      existing.status === "sending" ||
      existing.status === "complete")
  ) {
    redirect("/dashboard?first_win=in_progress");
  }

  const preview = await buildFirstWinPreview(orgId);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} current="dashboard" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 lg:px-6">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
            One-time setup
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-stone-900">
            Send your first batch of reminders.
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            We pulled every overdue invoice from QuickBooks. Review the list
            below, uncheck anyone you don&apos;t want texted, and click
            <strong> Start collecting</strong>. We&apos;ll send personalized
            reminders + a one-tap pay link, throttled and only during
            business hours (8am–9pm local).
          </p>
        </header>
        <FirstWinReview preview={preview} />
        <p className="mt-8 text-center text-[11px] text-stone-500">
          Nothing sends until you click Start collecting. Customers can
          reply STOP at any time — we honor it instantly.
        </p>
      </main>
    </div>
  );
}
