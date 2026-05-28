import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { logAuditEvent } from "../db/auditEvents";
import {
  createDraftBatch,
  getBatchForOrg,
  insertBatchItem,
  listBatchItems,
  listQueuedItems,
  markBatchStatus,
  markItemStatus,
  type FirstBatchItemRow,
  type FirstBatchRow,
} from "../db/onboardingBatches";
import { getOrgById } from "../db/organizations";
import { getOrCreatePayLink } from "../pay/links";
import { getDashboardData } from "../qbo/sync";
import { reminderSends } from "../db/schema";
import { checkCustomerEligibility } from "../sms/eligibility";
import { OptedOutError, sendRawSms } from "../twilio/sms";
import { buildFirstWinSms, fmtUsd } from "./firstWinMessage";

/* ───────── Preview / dry-run ─────────────────────────────────────── */

export type PreviewItem = {
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  amountCents: number;
  daysLate: number;
  eligible: boolean;
  /** When eligible=false, why we'd skip them. */
  skipReason: string | null;
};

export type PreviewResult = {
  batchId: number;
  status: FirstBatchRow["status"];
  totalAtRiskCents: number;
  eligibleCount: number;
  skippedCount: number;
  items: PreviewItem[];
};

/**
 * Pull currently-overdue customers from QBO sync, evaluate guardrails
 * (ignoring the hours window because the owner is staring at the preview
 * regardless of when they end up clicking), and persist as a draft batch.
 * Idempotent — re-running on the same org replaces the draft.
 */
export async function buildFirstWinPreview(
  organizationId: number,
): Promise<PreviewResult> {
  const data = await getDashboardData(organizationId);
  if (!data.connected) {
    return {
      batchId: 0,
      status: "draft",
      totalAtRiskCents: 0,
      eligibleCount: 0,
      skippedCount: 0,
      items: [],
    };
  }

  const overdue = data.customers.filter(
    (c) => c.daysLate > 0 && c.amountOwed > 0,
  );

  const totalAtRisk = overdue.reduce((s, c) => s + c.amountOwed, 0);
  const items: PreviewItem[] = overdue.map((c) => {
    const decision = checkCustomerEligibility({
      organizationId,
      phone: c.phone,
      amountCents: c.amountOwed,
      enforceHours: false, // preview ignores clock; send-time enforces.
    });
    return {
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone || null,
      amountCents: c.amountOwed,
      daysLate: c.daysLate,
      eligible: decision.ok,
      skipReason: decision.ok ? null : decision.reason,
    };
  });

  const eligibleCount = items.filter((i) => i.eligible).length;
  const skippedCount = items.length - eligibleCount;

  const batch = createDraftBatch({
    organizationId,
    totalAtRiskCents: totalAtRisk,
    eligibleCount,
    skippedCount,
  });

  // Replace any prior items for this batch — preview can be regenerated.
  const db = getDb();
  db.delete(
    (await import("../db/schema")).onboardingFirstBatchItems,
  )
    .where(
      eq(
        (await import("../db/schema")).onboardingFirstBatchItems.batchId,
        batch.id,
      ),
    )
    .run();

  for (const it of items) {
    insertBatchItem({
      batchId: batch.id,
      organizationId,
      customerId: it.customerId,
      customerName: it.customerName,
      customerPhone: it.customerPhone,
      amountCents: it.amountCents,
      status: it.eligible ? "queued" : "skipped",
      skipReason: it.skipReason,
    });
  }

  return {
    batchId: batch.id,
    status: batch.status,
    totalAtRiskCents: totalAtRisk,
    eligibleCount,
    skippedCount,
    items,
  };
}

/* ───────── Owner approval ───────────────────────────────────────── */

export function approveFirstWinBatch(
  organizationId: number,
  approvedByUserId: number,
  excludeCustomerIds: string[] = [],
): { ok: true; batchId: number; queuedCount: number } | { ok: false; reason: string } {
  const batch = getBatchForOrg(organizationId);
  if (!batch) return { ok: false, reason: "no_batch" };
  if (batch.status !== "draft" && batch.status !== "cancelled") {
    return { ok: false, reason: "already_approved" };
  }

  // Honor explicit excludes from the owner — flips eligible rows to
  // "skipped" with reason "owner_excluded".
  if (excludeCustomerIds.length > 0) {
    const items = listBatchItems(batch.id);
    for (const item of items) {
      if (
        item.status === "queued" &&
        excludeCustomerIds.includes(item.customerId)
      ) {
        markItemStatus(item.id, "skipped", {
          skipReason: "owner_excluded",
        });
      }
    }
  }

  markBatchStatus(batch.id, "approved", approvedByUserId);
  logAuditEvent({
    organizationId,
    userId: approvedByUserId,
    kind: "onboarding.first_batch_approved",
    targetType: "first_batch",
    targetId: String(batch.id),
    metadata: { excludedCount: excludeCustomerIds.length },
  });

  const queuedCount = listQueuedItems(batch.id, 999).length;
  return { ok: true, batchId: batch.id, queuedCount };
}

/* ───────── Send loop (called by cron) ───────────────────────────── */

/**
 * Pop up to `maxPerRun` queued items, re-check guardrails NOW (so a STOP
 * received between approval and send is honored), then either send +
 * record a reminder or skip with a reason. Returns the per-run summary.
 */
export async function sendNextFirstWinBatch(
  organizationId: number,
  maxPerRun = 5,
): Promise<{
  sent: number;
  skippedOutsideHours: number;
  skippedOptedOut: number;
  skippedOther: number;
  remaining: number;
}> {
  const summary = {
    sent: 0,
    skippedOutsideHours: 0,
    skippedOptedOut: 0,
    skippedOther: 0,
    remaining: 0,
  };
  const batch = getBatchForOrg(organizationId);
  if (!batch) return summary;
  if (batch.status !== "approved" && batch.status !== "sending") {
    return summary;
  }
  if (batch.status === "approved") {
    markBatchStatus(batch.id, "sending");
  }

  const org = getOrgById(organizationId);
  if (!org) return summary;
  const businessName = org.name;

  const items = listQueuedItems(batch.id, maxPerRun);
  for (const item of items) {
    const decision = checkCustomerEligibility({
      organizationId,
      phone: item.customerPhone,
      amountCents: item.amountCents,
      enforceHours: true,
    });

    if (!decision.ok) {
      // outside_hours leaves the row "queued" so a later cron run picks
      // it up. All other reasons mark "skipped" so we don't retry.
      if (decision.reason === "outside_hours") {
        summary.skippedOutsideHours++;
        continue;
      }
      markItemStatus(item.id, "skipped", { skipReason: decision.reason });
      if (decision.reason === "opted_out") summary.skippedOptedOut++;
      else summary.skippedOther++;
      continue;
    }

    try {
      const payLink = getOrCreatePayLink(organizationId, item.customerId);
      const body = buildFirstWinSms({
        customerName: item.customerName ?? "there",
        businessName,
        amountDollars: fmtUsd(item.amountCents),
        payUrl: payLink.url,
      });
      await sendRawSms({
        to: item.customerPhone!,
        body,
        organizationId,
      });
      // Record a reminder row tagged with this batch — that's how the
      // weekly report attributes "since you started" collections back to
      // the cohort.
      const db = getDb();
      const now = Date.now();
      const reminderRow = db
        .insert(reminderSends)
        .values({
          organizationId,
          customerId: item.customerId,
          tone: "first_win",
          channel: "sms",
          sentAt: now,
          firstBatchId: batch.id,
          createdAt: now,
        })
        .returning({ id: reminderSends.id })
        .get();
      markItemStatus(item.id, "sent", {
        sentAt: now,
        reminderId: reminderRow.id,
      });
      summary.sent++;
    } catch (err) {
      if (err instanceof OptedOutError) {
        markItemStatus(item.id, "skipped", { skipReason: "opted_out" });
        summary.skippedOptedOut++;
      } else {
        console.error("[first-win] send failed", item.id, err);
        markItemStatus(item.id, "failed", {
          skipReason: "send_error",
        });
        summary.skippedOther++;
      }
    }
  }

  // If nothing left queued, close the batch.
  const remaining = listQueuedItems(batch.id, 1);
  summary.remaining = remaining.length;
  if (remaining.length === 0) {
    markBatchStatus(batch.id, "complete");
  }
  return summary;
}

/* ───────── Summary used by weekly report ────────────────────────── */

export function getFirstBatchCohortSummary(organizationId: number): {
  batchId: number | null;
  reminderIds: number[];
} {
  const batch = getBatchForOrg(organizationId);
  if (!batch) return { batchId: null, reminderIds: [] };
  const db = getDb();
  const rows = db
    .select({ id: reminderSends.id })
    .from(reminderSends)
    .where(eq(reminderSends.firstBatchId, batch.id))
    .all();
  return { batchId: batch.id, reminderIds: rows.map((r) => r.id) };
}
