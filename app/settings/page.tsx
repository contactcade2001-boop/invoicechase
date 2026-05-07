import { redirect } from "next/navigation";
import { A2pRegistration } from "@/components/A2pRegistration";
import { AppHeader } from "@/components/AppHeader";
import { AutomationSettings } from "@/components/AutomationSettings";
import { PortalBranding } from "@/components/PortalBranding";
import {
  QboRefundAccounts,
  type QboPickItem,
} from "@/components/QboRefundAccounts";
import { EmailReminderTemplateEditor } from "@/components/EmailReminderTemplateEditor";
import { SmsTemplateEditor } from "@/components/SmsTemplateEditor";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getA2pRegistration } from "@/lib/server/db/a2p";
import { getConnectionForOrg } from "@/lib/server/db/connections";
import { getOrgById } from "@/lib/server/db/organizations";
import { getXeroConnectionForOrg } from "@/lib/server/db/xeroConnections";
import { isXeroConfigured } from "@/lib/server/env";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { getAppBaseUrl } from "@/lib/server/env";
import { listBankAccounts, listItems } from "@/lib/server/qbo/client";

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
  const xeroConn = getXeroConnectionForOrg(orgId);
  const xeroEnabled = isXeroConfigured();
  const businessName =
    conn?.companyName ?? xeroConn?.tenantName ?? "Your business";
  const isOwner = user.role === "owner";
  const a2p = getA2pRegistration(orgId);

  let bankAccounts: QboPickItem[] = [];
  let qboItems: QboPickItem[] = [];
  let qboLoadError: string | null = null;
  if (isOwner && conn) {
    try {
      const [accts, items] = await Promise.all([
        listBankAccounts(conn),
        listItems(conn),
      ]);
      bankAccounts = accts.map((a) => ({ id: a.Id, name: a.Name }));
      qboItems = items.map((i) => ({ id: i.Id, name: i.Name }));
    } catch (err) {
      console.error("[settings] qbo accounts load failed", err);
      qboLoadError = "QuickBooks API call failed";
    }
  }

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

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Email reminder template
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Used for the Email button on customer rows and the bulk-email path.
          </p>
          <div className="mt-5">
            <EmailReminderTemplateEditor
              initial={user.emailReminderTemplate ?? ""}
              businessName={businessName}
            />
          </div>
        </section>

        {isOwner ? (
          <>
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold">Accounting connection</h2>
              <p className="mt-1 text-sm text-slate-600">
                Connect QuickBooks Online{xeroEnabled ? " or Xero" : ""}.
                Customers, invoices, and payments sync automatically.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold">QuickBooks Online</p>
                  {conn ? (
                    <>
                      <p className="mt-1 text-xs text-slate-600">
                        Connected as{" "}
                        <span className="font-mono">
                          {conn.companyName ?? conn.realmId}
                        </span>
                      </p>
                      <form
                        action="/api/qbo/disconnect"
                        method="post"
                        className="mt-3"
                      >
                        <button
                          type="submit"
                          className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                        >
                          Disconnect QuickBooks
                        </button>
                      </form>
                    </>
                  ) : (
                    <a
                      href="/api/qbo/connect"
                      className="mt-3 inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Connect QuickBooks
                    </a>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold">Xero</p>
                  {!xeroEnabled ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Xero integration not configured on this server.
                    </p>
                  ) : xeroConn ? (
                    <>
                      <p className="mt-1 text-xs text-slate-600">
                        Connected as{" "}
                        <span className="font-mono">
                          {xeroConn.tenantName ?? xeroConn.tenantId}
                        </span>
                      </p>
                      <form
                        action="/api/xero/disconnect"
                        method="post"
                        className="mt-3"
                      >
                        <button
                          type="submit"
                          className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                        >
                          Disconnect Xero
                        </button>
                      </form>
                    </>
                  ) : (
                    <a
                      href="/api/xero/connect"
                      className="mt-3 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
                    >
                      Connect Xero
                    </a>
                  )}
                </div>
              </div>
              {conn && xeroConn ? (
                <p className="mt-3 text-xs text-amber-700">
                  Both connections active — we&apos;ll prefer QuickBooks. Disconnect QuickBooks if you want Xero to take over.
                </p>
              ) : null}
            </section>

            <AutomationSettings
              initial={{
                autopilotEnabled: org.autopilotEnabled === 1,
                depositEnabled: org.depositEnabled === 1,
                depositPercentBps: org.depositPercentBps,
                depositThresholdScore: org.depositThresholdScore,
                digestPhone: org.digestPhone ?? "",
                twilioPhone: org.twilioPhoneNumber ?? "",
                customReceiptsEnabled: org.customReceiptsEnabled === 1,
              }}
            />
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold">Customer portal branding</h2>
              <p className="mt-1 text-sm text-slate-600">
                Pick a slug and accent color so your customers see a branded
                portal at <code className="font-mono">/p/your-slug</code>{" "}
                instead of the generic Invoice Chase one. Receipt emails
                automatically link to the branded URL when set.
              </p>
              <div className="mt-4">
                <PortalBranding
                  initial={{
                    slug: org.portalSlug ?? "",
                    accentColor: org.portalAccentColor ?? "",
                    logoUrl: org.logoUrl ?? "",
                  }}
                  baseUrl={getAppBaseUrl()}
                />
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold">SMS compliance (A2P 10DLC)</h2>
              <div className="mt-4">
                <A2pRegistration
                  initial={{
                    legalBusinessName: a2p?.legalBusinessName ?? "",
                    businessEin: a2p?.businessEin ?? "",
                    brandId: a2p?.brandId ?? "",
                    campaignId: a2p?.campaignId ?? "",
                    brandStatus: a2p?.brandStatus ?? "not_started",
                    campaignStatus: a2p?.campaignStatus ?? "not_started",
                  }}
                />
              </div>
            </section>

            {conn ? (
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-lg font-semibold">
                  Refund accounting (QuickBooks)
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Tell us where partial-refund money came from + which line
                  item to use, and we&apos;ll auto-post a RefundReceipt to
                  QuickBooks whenever a Stripe partial refund fires.
                </p>
                <div className="mt-4">
                  <QboRefundAccounts
                    accounts={bankAccounts}
                    items={qboItems}
                    initial={{
                      depositToAccountId: org.qboDepositToAccountId ?? "",
                      refundItemId: org.qboRefundItemId ?? "",
                    }}
                    loadError={qboLoadError}
                  />
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold">Logs</h2>
              <p className="mt-1 text-sm text-slate-600">
                Webhook events show every Stripe + Twilio delivery; the audit
                log shows every action your team took inside Invoice Chase
                (role changes, settings edits, manual replies, refund retries).
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/webhook-events"
                  className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Webhook events
                </a>
                <a
                  href="/audit-events"
                  className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
                >
                  Audit log
                </a>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
