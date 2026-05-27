import "server-only";
import { and, eq, gte, lt } from "drizzle-orm";
import { getDb } from "../db/client";
import { listAllConnections } from "../db/connections";
import { getOrgById, listOrgsWithQboConnection } from "../db/organizations";
import { payments } from "../db/schema";
import { findUserById } from "../db/users";
import { sendEmail } from "../email/resend";
import { buildDailyDigest } from "../insights/dailyDigest";
import { getDashboardData } from "../qbo/sync";

export type DailyDigestResult = {
  attempted: number;
  delivered: number;
  skipped: number;
  errors: number;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function runDailyDigest(): Promise<DailyDigestResult> {
  const result: DailyDigestResult = {
    attempted: 0,
    delivered: 0,
    skipped: 0,
    errors: 0,
  };

  const db = getDb();
  const orgIds = new Set<number>();
  for (const c of listAllConnections()) orgIds.add(c.organizationId);
  for (const o of listOrgsWithQboConnection()) orgIds.add(o.id);

  const since = Date.now() - ONE_DAY_MS;

  for (const orgId of orgIds) {
    const org = getOrgById(orgId);
    if (!org) continue;
    const owner = findUserById(org.ownerUserId);
    if (!owner?.email) {
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

      const yesterdayPayments = db
        .select({
          amountCents: payments.amountCents,
        })
        .from(payments)
        .where(
          and(
            eq(payments.organizationId, orgId),
            eq(payments.status, "succeeded"),
            gte(payments.paidAt, since),
            lt(payments.paidAt, Date.now()),
          ),
        )
        .all();
      const collectedYesterdayCents = yesterdayPayments.reduce(
        (s, p) => s + p.amountCents,
        0,
      );

      const digest = buildDailyDigest({
        businessName: data.companyName || org.name,
        customers: data.customers,
        collectedYesterdayCents,
        paymentsYesterdayCount: yesterdayPayments.length,
      });

      await sendEmail({
        to: owner.email,
        subject: digest.subject,
        text: digest.textBody,
        html: digest.htmlBody,
      });
      result.delivered++;
    } catch (err) {
      console.error("[daily-digest] failed for org", orgId, err);
      result.errors++;
    }
  }
  return result;
}
