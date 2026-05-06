import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AutomationSettings } from "@/components/AutomationSettings";
import { SmsTemplateEditor } from "@/components/SmsTemplateEditor";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getConnectionForOrg } from "@/lib/server/db/connections";
import { getOrgById } from "@/lib/server/db/organizations";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "technician") redirect("/dashboard");
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/dashboard");
    redirect("/billing");
  }

  const org = getOrgById(orgId)!;
  const conn = getConnectionForOrg(orgId);
  const businessName = conn?.companyName ?? "Your business";
  const isOwner = user.role === "owner";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader user={user} current="settings" />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8 sm:py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Customize how Invoice Chase reaches out to your customers.
          </p>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">SMS template</h2>
          <p className="mt-1 text-sm text-slate-600">
            Used for both single-customer texts and the bulk-text button.
          </p>
          <div className="mt-5">
            <SmsTemplateEditor
              initial={user.smsTemplate ?? ""}
              businessName={businessName}
            />
          </div>
        </section>

        {isOwner ? (
          <AutomationSettings
            initial={{
              autopilotEnabled: org.autopilotEnabled === 1,
              depositEnabled: org.depositEnabled === 1,
              depositPercentBps: org.depositPercentBps,
              depositThresholdScore: org.depositThresholdScore,
              digestPhone: org.digestPhone ?? "",
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
