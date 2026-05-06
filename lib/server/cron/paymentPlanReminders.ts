import "server-only";
import { and, eq, gte, lt } from "drizzle-orm";
import { formatCurrencyDetailed } from "@/lib/format";
import { renderEmailReminder } from "@/lib/emailReminderTemplate";
import { getDb } from "../db/client";
import {
  paymentPlanInstallments,
  paymentPlans,
} from "../db/schema";
import { getOrgById } from "../db/organizations";
import { captureException } from "../observability";
import { getDashboardData } from "../qbo/sync";
import { getAppBaseUrl } from "../env";
import { sendEmail } from "../email/resend";
import { OptedOutError, sendRawSms } from "../twilio/sms";

export type ReminderRunResult = {
  installmentsConsidered: number;
  smsSent: number;
  emailsSent: number;
  skipped: number;
  errors: number;
};

const REMINDER_LEAD_DAYS = 2;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function dayOfYear(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dueDateMs(iso: string): number {
  return Date.parse(`${iso}T12:00:00Z`);
}

export async function runPaymentPlanReminders(opts?: {
  asOf?: Date;
}): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    installmentsConsidered: 0,
    smsSent: 0,
    emailsSent: 0,
    skipped: 0,
    errors: 0,
  };
  const now = opts?.asOf ?? new Date();
  const targetMs = now.getTime() + REMINDER_LEAD_DAYS * ONE_DAY_MS;
  const targetDate = new Date(targetMs);
  const targetIso = dayOfYear(targetDate);
  // Window: any installment whose due date falls on the target day,
  // still pending. We use the date-string match because dueDate is stored
  // as a plain YYYY-MM-DD string.
  const db = getDb();
  const dueRows = db
    .select({
      planId: paymentPlanInstallments.planId,
      sequence: paymentPlanInstallments.sequence,
      dueDate: paymentPlanInstallments.dueDate,
      amountCents: paymentPlanInstallments.amountCents,
      payLinkToken: paymentPlanInstallments.payLinkToken,
      status: paymentPlanInstallments.status,
    })
    .from(paymentPlanInstallments)
    .where(
      and(
        eq(paymentPlanInstallments.dueDate, targetIso),
        eq(paymentPlanInstallments.status, "pending"),
      ),
    )
    .all();

  if (dueRows.length === 0) return result;
  result.installmentsConsidered = dueRows.length;

  // Pull plans up front to map planId -> orgId, customerId.
  const planIds = Array.from(new Set(dueRows.map((r) => r.planId)));
  const planRows = db
    .select()
    .from(paymentPlans)
    .where(
      and(
        gte(paymentPlans.id, Math.min(...planIds)),
        lt(paymentPlans.id, Math.max(...planIds) + 1),
      ),
    )
    .all();
  const planById = new Map(planRows.map((p) => [p.id, p]));

  // Group by org so we hit dashboard data once per org.
  const byOrg = new Map<number, typeof dueRows>();
  for (const row of dueRows) {
    const plan = planById.get(row.planId);
    if (!plan) continue;
    const arr = byOrg.get(plan.organizationId) ?? [];
    arr.push(row);
    byOrg.set(plan.organizationId, arr);
  }

  for (const [orgId, rows] of byOrg) {
    const org = getOrgById(orgId);
    if (!org) continue;
    let dashboard;
    try {
      dashboard = await getDashboardData(orgId);
    } catch (err) {
      captureException(err, {
        where: "payment_plan_reminders.dashboard",
        orgId,
      });
      result.errors++;
      continue;
    }
    if (!dashboard.connected) continue;
    const customers = new Map(dashboard.customers.map((c) => [c.id, c]));
    for (const row of rows) {
      const plan = planById.get(row.planId);
      if (!plan) continue;
      const customer = customers.get(plan.customerId);
      if (!customer) {
        result.skipped++;
        continue;
      }
      const payUrl = row.payLinkToken
        ? `${getAppBaseUrl()}/pay/${row.payLinkToken}`
        : null;
      if (!payUrl) {
        result.skipped++;
        continue;
      }
      // Try SMS first (cheaper and faster), fall back to email if no phone.
      let sentChannel: "sms" | "email" | null = null;
      const smsBody = `${dashboard.companyName}: heads up — ${formatCurrencyDetailed(row.amountCents)} payment due ${row.dueDate}. ${payUrl}`;
      if (customer.phone) {
        try {
          await sendRawSms({
            to: customer.phone,
            body: smsBody,
            organizationId: orgId,
          });
          sentChannel = "sms";
          result.smsSent++;
        } catch (err) {
          if (!(err instanceof OptedOutError)) {
            captureException(err, {
              where: "payment_plan_reminders.sms",
              orgId,
              installmentId: row.payLinkToken,
            });
          }
        }
      }
      if (!sentChannel && customer.email) {
        try {
          const rendered = renderEmailReminder(
            {
              subject: `Upcoming payment to ${dashboard.companyName} on ${row.dueDate}`,
              body: smsBody,
            },
            {
              amountCents: row.amountCents,
              payUrl,
              customerName: customer.name,
              businessName: dashboard.companyName,
            },
          );
          await sendEmail({
            to: customer.email,
            subject: rendered.subject,
            text: rendered.text,
            html: rendered.html,
          });
          sentChannel = "email";
          result.emailsSent++;
        } catch (err) {
          captureException(err, {
            where: "payment_plan_reminders.email",
            orgId,
          });
          result.errors++;
        }
      }
      if (!sentChannel) result.skipped++;
    }
  }

  return result;
}
