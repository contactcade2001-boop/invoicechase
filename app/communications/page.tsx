import { Mail, MessageSquare } from "lucide-react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { EmailReminderTemplateEditor } from "@/components/EmailReminderTemplateEditor";
import { SmsTemplateEditor } from "@/components/SmsTemplateEditor";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getConnectionForOrg } from "@/lib/server/db/connections";
import { getJobberConnectionForOrg } from "@/lib/server/db/jobberConnections";
import { getXeroConnectionForOrg } from "@/lib/server/db/xeroConnections";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Communications — Invoice Chase" };

export default async function CommunicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "technician") redirect("/dashboard");
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/dashboard");
    redirect("/billing");
  }

  const qbo = getConnectionForOrg(orgId);
  const xero = getXeroConnectionForOrg(orgId);
  const jobber = getJobberConnectionForOrg(orgId);
  const businessName =
    qbo?.companyName ??
    xero?.tenantName ??
    jobber?.accountName ??
    "Your business";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader user={user} current="communications" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
          <p className="mt-2 text-sm text-slate-600">
            Pick how Invoice Chase texts and emails your customers. Six tones
            built-in — one click and you&apos;re done. You can customize the
            wording any time, but you don&apos;t have to.
          </p>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
              <MessageSquare className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                SMS template
              </h2>
              <p className="text-xs text-slate-500">
                What gets sent on every single-customer text and every bulk
                Text-with-AI.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <SmsTemplateEditor
              initial={user.smsTemplate ?? ""}
              businessName={businessName}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
              <Mail className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Email reminder template
              </h2>
              <p className="text-xs text-slate-500">
                Used for single-customer emails and bulk Email-with-AI sends.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <EmailReminderTemplateEditor
              initial={user.emailReminderTemplate ?? ""}
              businessName={businessName}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
