import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { WebhookEventControls } from "@/components/WebhookEventControls";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  listWebhookEventsForOrg,
  type WebhookEventFilters,
} from "@/lib/server/db/webhookEvents";
import { formatRelativeTime } from "@/lib/inboxFormat";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 200;

const STATUS_STYLES: Record<string, string> = {
  received: "bg-slate-100 text-slate-700 ring-slate-200",
  processed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ignored: "bg-slate-100 text-slate-500 ring-slate-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  errored: "bg-red-50 text-red-700 ring-red-200",
};

function StatusPill({ status }: { status: string }) {
  const cls =
    STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}

const SINCE_MS: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

type SearchParams = Promise<{
  source?: string;
  status?: string;
  type?: string;
  since?: string;
}>;

export function buildFilters(sp: {
  source?: string;
  status?: string;
  type?: string;
  since?: string;
}): WebhookEventFilters {
  const filters: WebhookEventFilters = {};
  if (sp.source === "stripe" || sp.source === "twilio") {
    filters.source = sp.source;
  }
  if (
    sp.status === "received" ||
    sp.status === "processed" ||
    sp.status === "ignored" ||
    sp.status === "rejected" ||
    sp.status === "errored"
  ) {
    filters.status = sp.status;
  }
  if (sp.type) filters.typeQuery = sp.type;
  if (sp.since && SINCE_MS[sp.since]) {
    filters.sinceMs = Date.now() - SINCE_MS[sp.since];
  }
  return filters;
}

export default async function WebhookEventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/dashboard");
  const orgId = user.organizationId!;

  const filters = buildFilters(sp);
  const events = listWebhookEventsForOrg(orgId, {
    limit: PAGE_SIZE,
    ...filters,
  });

  const exportQs = new URLSearchParams();
  if (sp.source) exportQs.set("source", sp.source);
  if (sp.status) exportQs.set("status", sp.status);
  if (sp.type) exportQs.set("type", sp.type);
  if (sp.since) exportQs.set("since", sp.since);
  const exportHref = `/webhook-events/export.csv${exportQs.toString() ? `?${exportQs}` : ""}`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader user={user} current="settings" />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-8 sm:py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhook events</h1>
          <p className="mt-1 text-sm text-slate-600">
            Recent Stripe + Twilio webhooks scoped to your organization. Useful
            for debugging billing or autopilot issues.
          </p>
        </div>
        <WebhookEventControls
          initial={{
            source: sp.source ?? "",
            status: sp.status ?? "",
            type: sp.type ?? "",
            since: sp.since ?? "",
          }}
          exportHref={exportHref}
        />
        {events.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              No matching events. Adjust the filters or wait for new webhooks
              to arrive.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">When</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Event ID</th>
                  <th className="px-4 py-3 text-left">Detail</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                      {formatRelativeTime(e.createdAt)}
                    </td>
                    <td className="px-4 py-2 capitalize text-slate-700">
                      {e.source}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-700">
                      {e.type ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <StatusPill status={e.status} />
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-slate-500">
                      {e.eventId
                        ? `${e.eventId.slice(0, 18)}${e.eventId.length > 18 ? "…" : ""}`
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {e.errorMessage ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-500">
          Events older than 30 days are pruned automatically by the weekly
          digest cron.
        </p>
      </main>
    </div>
  );
}
