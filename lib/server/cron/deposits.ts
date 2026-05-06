import "server-only";
import { formatCurrencyDetailed } from "@/lib/format";
import { getConnectionForOrg } from "../db/connections";
import {
  getOrgById,
  listOrgsWithQboConnection,
  markDepositPolled,
} from "../db/organizations";
import { findConversationByPhone } from "../db/sms";
import { createDepositPayLink } from "../pay/links";
import {
  listInvoicesCreatedSince,
  type QboInvoice,
} from "../qbo/client";
import { getDashboardData } from "../qbo/sync";
import { sendRawSms } from "../twilio/sms";
import type { Customer } from "@/lib/types";

export type DepositRunResult = {
  attempted: number;
  textsSent: number;
  skipped: number;
  errors: number;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

function pickWindow(lastPollAt: number | null): string {
  const since = lastPollAt
    ? new Date(lastPollAt - ONE_DAY_MS) // small overlap to catch late writes
    : new Date(Date.now() - SEVEN_DAYS_MS);
  return since.toISOString().slice(0, 10);
}

function customerHasRecentText(
  organizationId: number,
  phone: string,
): boolean {
  const conv = findConversationByPhone(organizationId, phone);
  if (!conv) return false;
  return conv.lastMessageAt > Date.now() - ONE_DAY_MS;
}

function depositAmount(
  invoice: QboInvoice,
  percentBps: number,
): number {
  const totalCents = Math.round(invoice.TotalAmt * 100);
  return Math.max(0, Math.floor((totalCents * percentBps) / 10000));
}

function buildDepositBody(input: {
  businessName: string;
  amountCents: number;
  payUrl: string;
}): string {
  return `${input.businessName}: please secure your job with a ${formatCurrencyDetailed(input.amountCents)} deposit. ${input.payUrl}`;
}

export async function runDepositAutomation(): Promise<DepositRunResult> {
  const result: DepositRunResult = {
    attempted: 0,
    textsSent: 0,
    skipped: 0,
    errors: 0,
  };

  const orgs = listOrgsWithQboConnection();
  for (const orgRow of orgs) {
    const org = getOrgById(orgRow.id);
    if (!org) continue;
    if (org.depositEnabled !== 1) {
      result.skipped++;
      continue;
    }
    const conn = getConnectionForOrg(org.id);
    if (!conn) {
      result.skipped++;
      continue;
    }
    result.attempted++;

    try {
      const sinceIso = pickWindow(org.lastDepositPollAt);
      const [recentInvoices, dashboard] = await Promise.all([
        listInvoicesCreatedSince(conn, sinceIso),
        getDashboardData(org.id),
      ]);
      if (!dashboard.connected) {
        result.skipped++;
        continue;
      }
      const customersById = new Map<string, Customer>();
      for (const c of dashboard.customers) customersById.set(c.id, c);
      const businessName = dashboard.companyName;

      const handledThisRun = new Set<string>();
      for (const invoice of recentInvoices) {
        const customerId = invoice.CustomerRef.value;
        if (handledThisRun.has(customerId)) continue;
        const customer = customersById.get(customerId);
        if (!customer || !customer.phone) continue;
        if (customer.reputationScore >= org.depositThresholdScore) continue;
        if (customerHasRecentText(org.id, customer.phone)) continue;

        const cents = depositAmount(invoice, org.depositPercentBps);
        if (cents <= 0) continue;

        const { url } = createDepositPayLink(org.id, customer.id, cents);
        try {
          await sendRawSms({
            to: customer.phone,
            body: buildDepositBody({
              businessName,
              amountCents: cents,
              payUrl: url,
            }),
            organizationId: org.id,
          });
          handledThisRun.add(customerId);
          result.textsSent++;
        } catch (err) {
          console.error("[deposits] send failed", err);
          result.errors++;
        }
      }
      markDepositPolled(org.id);
    } catch (err) {
      console.error("[deposits] org failed", org.id, err);
      result.errors++;
    }
  }

  return result;
}
