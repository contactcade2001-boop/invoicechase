import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUser } from "@/lib/server/auth/session";
import { listAuditEventsForOrg } from "@/lib/server/db/auditEvents";
import { formatRelativeTime } from "@/lib/inboxFormat";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 200;

const SINCE_MS: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

type SearchParams = Promise<{ kind?: string; since?: string }>;

function describe(row: {
  kind: string;
  metadataJson: string | null;
}): string {
  if (!row.metadataJson) return "";
  try {
    const meta = JSON.parse(row.metadataJson) as Record<string, unknown>;
    const pieces: string[] = [];
    for (const [k, v] of Object.entries(meta)) {
      if (v == null) continue;
      pieces.push(`${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
    }
    return pieces.join(" · ");
  } catch {
    return row.metadataJson;
  }
}

export default async function AuditEventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/dashboard");
  const orgId = user.organizationId!;

  const sinceMs = sp.since && SINCE_MS[sp.since]
    ? Date.now() - SINCE_MS[sp.since]
    : undefined;
  const events = listAuditEventsForOrg(orgId, {
    limit: PAGE_SIZE,
    kind: sp.kind,
    sinceMs,
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader user={user} current="settings" />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-8 sm:py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit log</h1>
          <p className="mt-1 text-sm text-slate-600">
            Who did what, when. Useful for tracing role changes, settings edits,
            manual replies, and refund retries across your team.
          </p>
        </div>

        <form
          method="get"
          className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Kind contains
            <input
              type="search"
              name="kind"
              defaultValue={sp.kind ?? ""}
              placeholder="team, sms, settings, qbo…"
              className="rounded-md border-0 px-2 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Time
            <select
              name="since"
              defaultValue={sp.since ?? ""}
              className="rounded-md border-0 px-2 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
            >
              <option value="">All time</option>
              <option value="1h">Last hour</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Apply
          </button>
        </form>

        {events.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              No matching audit events.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left">When</th>
                  <th className="px-4 py-3 text-left">Actor</th>
                  <th className="px-4 py-3 text-left">Kind</th>
                  <th className="px-4 py-3 text-left">Target</th>
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
                    <td className="px-4 py-2 text-slate-700">
                      {e.actorEmail ?? "system"}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-700">
                      {e.kind}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {e.targetType
                        ? `${e.targetType}:${e.targetId ?? ""}`
                        : ""}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {describe(e)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-500">
          The most recent {PAGE_SIZE} events are shown.
        </p>
      </main>
    </div>
  );
}
