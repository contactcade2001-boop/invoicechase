import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { listWebhookEventsForOrg } from "@/lib/server/db/webhookEvents";
import { buildFilters } from "@/app/webhook-events/page";

export const dynamic = "force-dynamic";

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  if (user.role !== "owner") {
    return new NextResponse("forbidden", { status: 403 });
  }
  const orgId = user.organizationId!;
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const filters = buildFilters(sp);
  const rows = listWebhookEventsForOrg(orgId, {
    limit: 5000,
    ...filters,
  });
  const header = [
    "created_at",
    "source",
    "type",
    "status",
    "event_id",
    "error_message",
    "payload_digest",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        new Date(r.createdAt).toISOString(),
        r.source,
        r.type ?? "",
        r.status,
        r.eventId ?? "",
        r.errorMessage ?? "",
        r.payloadDigest ?? "",
      ]
        .map(escapeCsv)
        .join(","),
    );
  }
  const body = lines.join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="webhook-events-${Date.now()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
