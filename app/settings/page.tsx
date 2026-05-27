import { redirect } from "next/navigation";
import { A2pRegistration } from "@/components/A2pRegistration";
import { AppHeader } from "@/components/AppHeader";
import { AutomationSettings } from "@/components/AutomationSettings";
import {
  FieldPulseLogo,
  HousecallProLogo,
  JobberLogo,
  QuickBooksLogo,
  ServiceTitanLogo,
  WorkizLogo,
  XeroLogo,
} from "@/components/BrandLogos";
import { FieldPulseConnectForm } from "@/components/FieldPulseConnectForm";
import { PortalBranding } from "@/components/PortalBranding";
import {
  QboRefundAccounts,
  type QboPickItem,
} from "@/components/QboRefundAccounts";
import { WorkizConnectForm } from "@/components/WorkizConnectForm";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getA2pRegistration } from "@/lib/server/db/a2p";
import { getConnectionForOrg } from "@/lib/server/db/connections";
import {
  getFieldPulseConnection,
  getHousecallProConnection,
  getServiceTitanConnection,
  getWorkizConnection,
} from "@/lib/server/db/fsmConnections";
import { getJobberConnectionForOrg } from "@/lib/server/db/jobberConnections";
import { getOrgById } from "@/lib/server/db/organizations";
import { getXeroConnectionForOrg } from "@/lib/server/db/xeroConnections";
import {
  isHousecallProConfigured,
  isJobberConfigured,
  isServiceTitanConfigured,
  isXeroConfigured,
} from "@/lib/server/env";
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
  const jobberConn = getJobberConnectionForOrg(orgId);
  const hcpConn = getHousecallProConnection(orgId);
  const stConn = getServiceTitanConnection(orgId);
  const fpConn = getFieldPulseConnection(orgId);
  const wzConn = getWorkizConnection(orgId);
  const xeroEnabled = isXeroConfigured();
  const jobberEnabled = isJobberConfigured();
  const hcpEnabled = isHousecallProConfigured();
  const stEnabled = isServiceTitanConfigured();
  const businessName =
    conn?.companyName ??
    xeroConn?.tenantName ??
    jobberConn?.accountName ??
    hcpConn?.accountName ??
    stConn?.tenantName ??
    fpConn?.accountName ??
    wzConn?.accountName ??
    "Your business";
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

        {isOwner ? (
          <>
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold">Accounting &amp; FSM connections</h2>
              <p className="mt-1 text-sm text-slate-600">
                Connect the system that holds your customers and invoices.
                One per organization — switching is just disconnect, then
                reconnect. We sort priority QuickBooks → Xero → Jobber when
                multiple are present.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2">
                    <QuickBooksLogo size={20} />
                    <p className="text-sm font-semibold">QuickBooks Online</p>
                  </div>
                  {conn ? (
                    <>
                      <p className="mt-2 text-xs text-slate-600">
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
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      <QuickBooksLogo size={14} />
                      Connect QuickBooks
                    </a>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2">
                    <XeroLogo size={20} />
                    <p className="text-sm font-semibold">Xero</p>
                  </div>
                  {!xeroEnabled ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Not configured on this server.
                    </p>
                  ) : xeroConn ? (
                    <>
                      <p className="mt-2 text-xs text-slate-600">
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
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
                    >
                      <XeroLogo size={14} />
                      Connect Xero
                    </a>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2">
                    <JobberLogo size={20} />
                    <p className="text-sm font-semibold">Jobber</p>
                  </div>
                  {!jobberEnabled ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Not configured on this server.
                    </p>
                  ) : jobberConn ? (
                    <>
                      <p className="mt-2 text-xs text-slate-600">
                        Connected as{" "}
                        <span className="font-mono">
                          {jobberConn.accountName ?? jobberConn.accountId}
                        </span>
                      </p>
                      <form
                        action="/api/jobber/disconnect"
                        method="post"
                        className="mt-3"
                      >
                        <button
                          type="submit"
                          className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                        >
                          Disconnect Jobber
                        </button>
                      </form>
                    </>
                  ) : (
                    <a
                      href="/api/jobber/connect"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
                    >
                      <JobberLogo size={14} />
                      Connect Jobber
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Field service platforms (Beta)
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Connections work today. Live sync rolls out per tenant once
                  vendor API access is approved — until then customer data
                  shows the QuickBooks/Xero/Jobber feed.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {/* Housecall Pro */}
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex items-center gap-2">
                      <HousecallProLogo size={20} />
                      <p className="text-sm font-semibold">Housecall Pro</p>
                    </div>
                    {!hcpEnabled ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Set <code className="font-mono">HOUSECALLPRO_*</code>{" "}
                        env vars after partner approval.
                      </p>
                    ) : hcpConn ? (
                      <>
                        <p className="mt-2 text-xs text-slate-600">Connected</p>
                        <form
                          action="/api/housecallpro/disconnect"
                          method="post"
                          className="mt-3"
                        >
                          <button
                            type="submit"
                            className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                          >
                            Disconnect Housecall Pro
                          </button>
                        </form>
                      </>
                    ) : (
                      <a
                        href="/api/housecallpro/connect"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
                      >
                        <HousecallProLogo size={14} />
                        Connect Housecall Pro
                      </a>
                    )}
                  </div>

                  {/* ServiceTitan */}
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex items-center gap-2">
                      <ServiceTitanLogo size={20} />
                      <p className="text-sm font-semibold">ServiceTitan</p>
                    </div>
                    {!stEnabled ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Set <code className="font-mono">SERVICETITAN_*</code>{" "}
                        env vars after partner approval.
                      </p>
                    ) : stConn ? (
                      <>
                        <p className="mt-2 text-xs text-slate-600">
                          Tenant{" "}
                          <span className="font-mono">{stConn.tenantId}</span>
                        </p>
                        <form
                          action="/api/servicetitan/disconnect"
                          method="post"
                          className="mt-3"
                        >
                          <button
                            type="submit"
                            className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                          >
                            Disconnect ServiceTitan
                          </button>
                        </form>
                      </>
                    ) : (
                      <a
                        href="/api/servicetitan/connect"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
                      >
                        <ServiceTitanLogo size={14} />
                        Connect ServiceTitan
                      </a>
                    )}
                  </div>

                  {/* FieldPulse (API key) */}
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex items-center gap-2">
                      <FieldPulseLogo size={20} />
                      <p className="text-sm font-semibold">FieldPulse</p>
                    </div>
                    {fpConn ? (
                      <>
                        <p className="mt-2 text-xs text-slate-600">
                          Connected as{" "}
                          <span className="font-mono">
                            {fpConn.accountName ?? `org #${orgId}`}
                          </span>
                        </p>
                        <form
                          action="/api/fieldpulse/disconnect"
                          method="post"
                          className="mt-3"
                        >
                          <button
                            type="submit"
                            className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                          >
                            Disconnect FieldPulse
                          </button>
                        </form>
                      </>
                    ) : (
                      <FieldPulseConnectForm initialAccountName={null} />
                    )}
                  </div>

                  {/* Workiz (API token + secret) */}
                  <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex items-center gap-2">
                      <WorkizLogo size={20} />
                      <p className="text-sm font-semibold">Workiz</p>
                    </div>
                    {wzConn ? (
                      <>
                        <p className="mt-2 text-xs text-slate-600">
                          Connected as{" "}
                          <span className="font-mono">
                            {wzConn.accountName ?? `org #${orgId}`}
                          </span>
                        </p>
                        <form
                          action="/api/workiz/disconnect"
                          method="post"
                          className="mt-3"
                        >
                          <button
                            type="submit"
                            className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                          >
                            Disconnect Workiz
                          </button>
                        </form>
                      </>
                    ) : (
                      <WorkizConnectForm initialAccountName={null} />
                    )}
                  </div>
                </div>
              </div>
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
                reminderSequencesEnabled:
                  org.reminderSequencesEnabled === 1,
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
