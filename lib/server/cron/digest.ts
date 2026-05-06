import "server-only";
import { formatCurrencyDetailed } from "@/lib/format";
import { listAllConnections } from "../db/connections";
import {
  getOrgById,
  listOrgsWithQboConnection,
  markDigestSent,
} from "../db/organizations";
import { pruneWebhookEventsOlderThan } from "../db/webhookEvents";
import { getDashboardData } from "../qbo/sync";
import { sendRawSms } from "../twilio/sms";

export type DigestRunResult = {
  attempted: number;
  delivered: number;
  skipped: number;
  errors: number;
  webhookEventsPruned: number;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function buildDigestBody(input: {
  totalOwedCents: number;
  overdueCount: number;
  topDebtorName: string | null;
  topDebtorCents: number;
}): string {
  const lines: string[] = [];
  lines.push(
    `Invoice Chase weekly: ${formatCurrencyDetailed(input.totalOwedCents)} outstanding.`,
  );
  if (input.overdueCount > 0) {
    lines.push(
      `${input.overdueCount} customer${input.overdueCount === 1 ? "" : "s"} overdue.`,
    );
  } else {
    lines.push("Nothing overdue. ");
  }
  if (input.topDebtorName && input.topDebtorCents > 0) {
    lines.push(
      `Biggest balance: ${input.topDebtorName} (${formatCurrencyDetailed(input.topDebtorCents)}).`,
    );
  }
  return lines.join(" ");
}

export async function runWeeklyDigest(): Promise<DigestRunResult> {
  const result: DigestRunResult = {
    attempted: 0,
    delivered: 0,
    skipped: 0,
    errors: 0,
    webhookEventsPruned: 0,
  };
  const connections = listAllConnections();
  const orgIds = new Set<number>();
  for (const c of connections) orgIds.add(c.organizationId);
  // Also include orgs without QBO so they don't error silently.
  for (const o of listOrgsWithQboConnection()) orgIds.add(o.id);

  for (const orgId of orgIds) {
    const org = getOrgById(orgId);
    if (!org) continue;
    if (!org.digestPhone) {
      result.skipped++;
      continue;
    }
    result.attempted++;
    try {
      const data = await getDashboardData(orgId);
      if (!data.connected) {
        result.skipped++;
        continue;
      }
      const totalOwedCents = data.customers.reduce(
        (s, c) => s + c.amountOwed,
        0,
      );
      const overdue = data.customers.filter((c) => c.daysLate > 0);
      const top = [...data.customers].sort(
        (a, b) => b.amountOwed - a.amountOwed,
      )[0];
      const body = buildDigestBody({
        totalOwedCents,
        overdueCount: overdue.length,
        topDebtorName: top?.name ?? null,
        topDebtorCents: top?.amountOwed ?? 0,
      });
      await sendRawSms({
        to: org.digestPhone,
        body,
        organizationId: org.id,
      });
      markDigestSent(orgId);
      result.delivered++;
    } catch (err) {
      console.error("[digest] failed for org", orgId, err);
      result.errors++;
    }
  }

  // Retention: drop webhook_events older than 30 days. Errors here don't fail
  // the cron — the digest already finished.
  try {
    result.webhookEventsPruned = pruneWebhookEventsOlderThan(
      Date.now() - THIRTY_DAYS_MS,
    );
  } catch (err) {
    console.error("[digest] webhook_events prune failed", err);
  }

  return result;
}
