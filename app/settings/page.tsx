import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { SmsTemplateEditor } from "@/components/SmsTemplateEditor";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getConnectionForUser } from "@/lib/server/db/connections";
import {
  getSubscriptionByUserId,
  isActive,
} from "@/lib/server/db/subscriptions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isActive(getSubscriptionByUserId(user.id))) redirect("/billing");

  const conn = getConnectionForUser(user.id);
  const businessName = conn?.companyName ?? "Your business";

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
      </main>
    </div>
  );
}
