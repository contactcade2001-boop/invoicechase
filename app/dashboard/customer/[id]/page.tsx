import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { AppointmentScheduler } from "@/components/AppointmentScheduler";
import { AutopayEnrollButton } from "@/components/AutopayEnrollButton";
import { CustomerDetail } from "@/components/CustomerDetail";
import { CustomerMetadataPanel } from "@/components/CustomerMetadataPanel";
import { JobPhotoUploader } from "@/components/JobPhotoUploader";
import { getCurrentUser } from "@/lib/server/auth/session";
import { listUpcomingAppointments } from "@/lib/server/db/appointments";
import { getAutopayMethod } from "@/lib/server/db/autopay";
import { getCustomerMetadata } from "@/lib/server/db/customerMetadata";
import { findActivePayLink } from "@/lib/server/db/payLinks";
import { listJobPhotos } from "@/lib/server/jobPhotos/store";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { getCustomerDetail } from "@/lib/server/qbo/sync";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function CustomerDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/dashboard");
    redirect("/billing");
  }

  const detail = await getCustomerDetail(orgId, id);
  const activePayLink = findActivePayLink(orgId, id);
  const metadata = getCustomerMetadata(orgId, id);
  const autopay = getAutopayMethod(orgId, id);
  const appointments = listUpcomingAppointments(orgId, id);
  const photos = listJobPhotos(orgId, id);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} current="dashboard" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
        {detail.ok ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <CustomerDetail
                customer={detail.customer}
                invoices={detail.invoices}
                payLinkViewedAt={activePayLink?.viewedAt ?? null}
                payLinkViewedCount={activePayLink?.viewedCount ?? 0}
              />
              <JobPhotoUploader
                customerId={id}
                initialPhotos={photos.map((p) => ({
                  id: p.id,
                  caption: p.caption,
                  createdAt: p.createdAt,
                }))}
              />
            </div>
            <div className="space-y-4">
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
                <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Autopay
                </h3>
                <p className="mt-1 text-xs text-stone-500">
                  Save a card or bank to charge automatically when invoices
                  issue.
                </p>
                <div className="mt-3">
                  {detail.customer.email ? (
                    <AutopayEnrollButton
                      customerId={id}
                      customerEmail={detail.customer.email}
                      customerName={detail.customer.name}
                      enrolled={!!autopay}
                      paused={autopay?.paused === 1}
                      brand={autopay?.brand ?? null}
                      last4={autopay?.last4 ?? null}
                    />
                  ) : (
                    <p className="text-xs text-stone-500">
                      Add a customer email to enable autopay.
                    </p>
                  )}
                </div>
              </section>
              <CustomerMetadataPanel
                customerId={id}
                initialNote={metadata?.note ?? null}
                initialSnoozedUntil={metadata?.snoozedUntil ?? null}
                initialTags={metadata?.tags ?? []}
                initialTone={metadata?.tone ?? null}
              />
              <AppointmentScheduler
                customerId={id}
                customerName={detail.customer.name}
                customerPhone={detail.customer.phone || null}
                initialAppointments={appointments.map((a) => ({
                  id: a.id,
                  scheduledFor: a.scheduledFor,
                  description: a.description,
                  reminderDaysBefore: a.reminderDaysBefore,
                  reminderSentAt: a.reminderSentAt,
                }))}
              />
            </div>
          </div>
        ) : detail.reason === "not_connected" ? (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-stone-200">
            <h1 className="text-xl font-bold">Not connected</h1>
            <p className="mt-2 text-sm text-stone-600">
              Reconnect QuickBooks from{" "}
              <Link href="/dashboard" className="underline">
                the dashboard
              </Link>
              .
            </p>
          </div>
        ) : (
          notFound()
        )}
      </main>
    </div>
  );
}
