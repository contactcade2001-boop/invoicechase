import "server-only";
import { sendEmail } from "../email/resend";
import { listAllOrgs } from "../db/organizations";
import { getOrCreatePayLink } from "../pay/links";
import { getDashboardData } from "../qbo/sync";
import {
  findRecentSend,
  recordReminderSend,
} from "../db/reminderSends";
import {
  renderEmailReminder,
  renderSmsReminder,
  toneForDaysLate,
} from "../reminders/tones";
import { OptedOutError, sendRawSms } from "../twilio/sms";
import { captureException } from "../observability";

export type ReminderRunResult = {
  orgsScanned: number;
  customersSeen: number;
  smsSent: number;
  emailsSent: number;
  skippedRecent: number;
  skippedNoChannel: number;
  errors: number;
};

// 6-day cooldown per tone per customer — so a customer who lands in
// "polite" doesn't get hit every day; once they cross into the next tone
// they get the next message.
const COOLDOWN_MS = 6 * 24 * 60 * 60 * 1000;

export async function runReminderSequences(): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    orgsScanned: 0,
    customersSeen: 0,
    smsSent: 0,
    emailsSent: 0,
    skippedRecent: 0,
    skippedNoChannel: 0,
    errors: 0,
  };

  const orgs = listAllOrgs().filter(
    (o) => o.reminderSequencesEnabled === 1,
  );
  for (const org of orgs) {
    result.orgsScanned++;
    let dashboard;
    try {
      dashboard = await getDashboardData(org.id);
    } catch (err) {
      captureException(err, {
        where: "reminder_sequences.dashboard",
        organizationId: org.id,
      });
      result.errors++;
      continue;
    }
    if (!dashboard.connected) continue;

    const overdue = dashboard.customers.filter((c) => c.daysLate > 0);
    result.customersSeen += overdue.length;

    for (const customer of overdue) {
      const tone = toneForDaysLate(customer.daysLate);
      if (!tone) continue;

      // 6-day cooldown per (customer, tone) so we don't blast them.
      if (
        findRecentSend({
          organizationId: org.id,
          customerId: customer.id,
          tone,
          sinceMs: Date.now() - COOLDOWN_MS,
        })
      ) {
        result.skippedRecent++;
        continue;
      }

      if (!customer.phone && !customer.email) {
        result.skippedNoChannel++;
        continue;
      }

      const { url } = getOrCreatePayLink(org.id, customer.id);
      const vars = {
        businessName: dashboard.companyName,
        customerName: customer.name,
        amountCents: customer.amountOwed,
        daysLate: customer.daysLate,
        payUrl: url,
      };

      // SMS first if we have a phone; email if we have an address. Both
      // are fine — one gets read at the kitchen counter, the other at the
      // desk. Each is rate-limited via the existing twilio/resend paths.
      let sentChannel: string | null = null;
      if (customer.phone) {
        try {
          await sendRawSms({
            to: customer.phone,
            body: renderSmsReminder(tone, vars),
            organizationId: org.id,
          });
          result.smsSent++;
          sentChannel = sentChannel ? `${sentChannel}+sms` : "sms";
        } catch (err) {
          if (!(err instanceof OptedOutError)) {
            captureException(err, {
              where: "reminder_sequences.sms",
              organizationId: org.id,
            });
            result.errors++;
          }
        }
      }
      if (customer.email) {
        try {
          const rendered = renderEmailReminder(tone, vars);
          await sendEmail({
            to: customer.email,
            subject: rendered.subject,
            text: rendered.text,
          });
          result.emailsSent++;
          sentChannel = sentChannel ? `${sentChannel}+email` : "email";
        } catch (err) {
          captureException(err, {
            where: "reminder_sequences.email",
            organizationId: org.id,
          });
          result.errors++;
        }
      }

      if (sentChannel) {
        recordReminderSend({
          organizationId: org.id,
          customerId: customer.id,
          tone,
          channel: sentChannel,
        });
      }
    }
  }
  return result;
}
