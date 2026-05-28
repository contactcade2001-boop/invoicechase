import "server-only";
import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { logAuditEvent } from "../db/auditEvents";
import { listAllConnections } from "../db/connections";
import { getOrgById, listOrgsWithQboConnection } from "../db/organizations";
import { findUserById } from "../db/users";
import { sendEmail } from "../email/resend";
import {
  autopayMethods,
  paidInvoices,
  reminderSends,
  weeklyReportSends,
} from "../db/schema";
import { sendRawSms } from "../twilio/sms";
import {
  computeCurrentDso,
  getBaselineDso,
  getCollectionTotals,
} from "../insights/dso";
import {
  buildWeeklyReport,
  type BuiltReport,
} from "../reports/weeklyReport";
import {
  isInDeliveryWindow,
  weekKey,
  weekRangeLabel,
  weeklyWindow,
} from "../reports/weeklySchedule";

export type WeeklyReportRunResult = {
  considered: number;
  sentSms: number;
  sentEmail: number;
  skipped: number;
  errors: number;
};

const ATTRIBUTION_WINDOW_DAYS = 14;

/**
 * Iterates every org with any sync connection. For each, checks the
 * delivery window in their timezone + the per-org toggle + idempotency
 * key, then sends SMS + email and records the result.
 */
export async function runWeeklyReport(
  nowMs: number = Date.now(),
): Promise<WeeklyReportRunResult> {
  const result: WeeklyReportRunResult = {
    considered: 0,
    sentSms: 0,
    sentEmail: 0,
    skipped: 0,
    errors: 0,
  };

  const orgIds = new Set<number>();
  for (const c of listAllConnections()) orgIds.add(c.organizationId);
  for (const o of listOrgsWithQboConnection()) orgIds.add(o.id);

  for (const orgId of orgIds) {
    const org = getOrgById(orgId);
    if (!org) continue;
    result.considered++;

    if (org.weeklyReportEnabled !== 1) {
      result.skipped++;
      continue;
    }
    if (
      !isInDeliveryWindow({
        nowMs,
        timezone: org.timezone || "America/New_York",
        dow: org.weeklyReportDow ?? 5,
        hour: org.weeklyReportHour ?? 9,
      })
    ) {
      continue; // Wrong hour for this org — silent, don't count as skip.
    }

    const key = weekKey(nowMs, org.timezone || "America/New_York");
    const existing = recordAttempt(orgId, key);
    if (existing.alreadySent) {
      result.skipped++;
      continue;
    }

    const facts = await collectWeekFacts({ org, nowMs });
    const built = buildWeeklyReport(facts);

    if (built.kind === "skip") {
      markSkipped(orgId, key, built.reason);
      result.skipped++;
      continue;
    }

    const owner = findUserById(org.ownerUserId);
    const phone = org.digestPhone;
    const email = owner?.email;

    let smsSentAt: number | null = null;
    let emailSentAt: number | null = null;

    if (phone) {
      try {
        await sendRawSms({
          to: phone,
          body: built.sms,
          organizationId: orgId,
        });
        smsSentAt = Date.now();
        result.sentSms++;
      } catch (err) {
        console.error("[weekly-report] sms failed", orgId, err);
        result.errors++;
      }
    }

    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: built.email.subject,
          text: built.email.text,
          html: built.email.html,
        });
        emailSentAt = Date.now();
        result.sentEmail++;
      } catch (err) {
        console.error("[weekly-report] email failed", orgId, err);
        result.errors++;
      }
    }

    finalizeSend(orgId, key, {
      smsSentAt,
      emailSentAt,
      totalCollectedCents: facts.totalCollectedCents,
      kind: built.kind,
    });

    logAuditEvent({
      organizationId: orgId,
      kind: "report.weekly_sent",
      targetType: "organization",
      targetId: String(orgId),
      metadata: {
        weekKey: key,
        kind: built.kind,
        totalCollectedCents: facts.totalCollectedCents,
        smsSent: !!smsSentAt,
        emailSent: !!emailSentAt,
      },
    });
  }

  return result;
}

/* ───── helpers ──────────────────────────────────────────────────── */

type CollectFactsInput = {
  org: NonNullable<ReturnType<typeof getOrgById>>;
  nowMs: number;
};

async function collectWeekFacts({ org, nowMs }: CollectFactsInput) {
  const { fromMs, toMs } = weeklyWindow(nowMs);
  const dashboardBase =
    (process.env.APP_BASE_URL ?? "https://invoicechase.com").replace(
      /\/$/,
      "",
    );

  const totals = getCollectionTotals(org.id, fromMs, toMs);

  // Itemize for the email body. Most-recent first; cap at 10 so very
  // active weeks don't blow up the message.
  const db = getDb();
  const rows = db
    .select({
      customerId: paidInvoices.customerId,
      amountCents: paidInvoices.amountCents,
      daysToPayment: paidInvoices.daysToPayment,
      attributedReminderId: paidInvoices.attributedReminderId,
    })
    .from(paidInvoices)
    .where(
      and(
        eq(paidInvoices.organizationId, org.id),
        gte(paidInvoices.paidAt, fromMs),
        lte(paidInvoices.paidAt, toMs),
      ),
    )
    .orderBy(sql`${paidInvoices.paidAt} DESC`)
    .limit(10)
    .all();

  // Customer names — best-effort from the most recent paid-invoice rows.
  // (We don't keep a customers table; the dashboard layer pulls from
  // QBO. For this email we just use the customer_id when we don't have
  // a friendlier label, which is the fast path that won't block sends.)
  const items = rows.map((r) => ({
    customerName: r.customerId,
    amountCents: r.amountCents,
    daysToPayment: r.daysToPayment,
    attributed: r.attributedReminderId != null,
  }));

  const baseline = getBaselineDso(org.id);
  const current = computeCurrentDso(org.id, 30);

  // Background-signal counts for the zero-week template.
  const remindersSentThisWeek = (
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(reminderSends)
      .where(
        and(
          eq(reminderSends.organizationId, org.id),
          gte(reminderSends.sentAt, fromMs),
          lte(reminderSends.sentAt, toMs),
        ),
      )
      .get()?.c ?? 0
  ) as number;

  const autopayActiveCount = (
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(autopayMethods)
      .where(
        and(
          eq(autopayMethods.organizationId, org.id),
          eq(autopayMethods.paused, 0),
        ),
      )
      .get()?.c ?? 0
  ) as number;

  // "Invoices now current" = paid_invoices rows in the window that were
  // attributed (i.e. moved from overdue to current after our action).
  const invoicesNowCurrent = (
    db
      .select({ c: sql<number>`COUNT(*)` })
      .from(paidInvoices)
      .where(
        and(
          eq(paidInvoices.organizationId, org.id),
          gte(paidInvoices.paidAt, fromMs),
          lte(paidInvoices.paidAt, toMs),
          isNotNull(paidInvoices.attributedReminderId),
        ),
      )
      .get()?.c ?? 0
  ) as number;

  return {
    businessName: org.name,
    weekRangeLabel: weekRangeLabel(nowMs, org.timezone || "America/New_York"),
    totalCollectedCents: totals.totalCollectedCents,
    paidInvoiceCount: totals.paidInvoiceCount,
    attributedCents: totals.attributedCents,
    items,
    baselineDsoDays: baseline?.dsoDays ?? null,
    currentDsoDays: current.dsoDays,
    remindersSentThisWeek: Number(remindersSentThisWeek),
    autopayActiveCount: Number(autopayActiveCount),
    invoicesNowCurrent: Number(invoicesNowCurrent),
    dashboardUrl: `${dashboardBase}/dashboard`,
  };
}

function recordAttempt(
  organizationId: number,
  key: string,
): { alreadySent: boolean } {
  const db = getDb();
  const existing = db
    .select()
    .from(weeklyReportSends)
    .where(
      and(
        eq(weeklyReportSends.organizationId, organizationId),
        eq(weeklyReportSends.weekKey, key),
      ),
    )
    .get();
  if (existing) {
    // We allow a "retry the other channel" if one succeeded and one
    // didn't, but the cron itself dedupes by treating any prior row as
    // sent. Simpler + safer.
    const wasSent =
      (existing.smsSentAt ?? null) !== null ||
      (existing.emailSentAt ?? null) !== null ||
      (existing.skippedReason ?? null) !== null;
    return { alreadySent: wasSent };
  }
  db.insert(weeklyReportSends)
    .values({
      organizationId,
      weekKey: key,
      createdAt: Date.now(),
    })
    .run();
  return { alreadySent: false };
}

function finalizeSend(
  organizationId: number,
  key: string,
  patch: {
    smsSentAt: number | null;
    emailSentAt: number | null;
    totalCollectedCents: number;
    kind: BuiltReport["kind"];
  },
): void {
  const db = getDb();
  db.update(weeklyReportSends)
    .set({
      smsSentAt: patch.smsSentAt,
      emailSentAt: patch.emailSentAt,
      totalCollectedCents: patch.totalCollectedCents,
      skippedReason: patch.kind === "skip" ? "no-activity" : null,
    })
    .where(
      and(
        eq(weeklyReportSends.organizationId, organizationId),
        eq(weeklyReportSends.weekKey, key),
      ),
    )
    .run();
}

function markSkipped(
  organizationId: number,
  key: string,
  reason: string,
): void {
  const db = getDb();
  db.update(weeklyReportSends)
    .set({ skippedReason: reason })
    .where(
      and(
        eq(weeklyReportSends.organizationId, organizationId),
        eq(weeklyReportSends.weekKey, key),
      ),
    )
    .run();
}
