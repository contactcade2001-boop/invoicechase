import "server-only";
import { getConnectionForOrg } from "../db/connections";
import { listPaymentsForCustomerEmail } from "../db/payments";
import { getOrgById } from "../db/organizations";
import { listOpenInvoicesForCustomer } from "../qbo/client";
import { captureException } from "../observability";
import { getOrCreatePayLink } from "../pay/links";
import { getAppBaseUrl } from "../env";

export type OutstandingInvoice = {
  qboInvoiceId: string;
  docNumber: string | null;
  txnDate: string;
  dueDate: string | null;
  totalCents: number;
  balanceCents: number;
};

export type OutstandingForMerchant = {
  organizationId: number;
  businessName: string;
  customerId: string;
  customerName: string | null;
  totalOpenCents: number;
  invoices: OutstandingInvoice[];
  payUrl: string | null;
};

// For each (org, customer) the email has paid through, fetch the customer's
// current open invoices. Returns one entry per merchant/customer combo that
// has any outstanding balance.
export async function listOutstandingForCustomerEmail(
  email: string,
): Promise<OutstandingForMerchant[]> {
  const payments = listPaymentsForCustomerEmail(email, 500);
  const seen = new Set<string>();
  const pairs: Array<{ organizationId: number; customerId: string }> = [];
  for (const p of payments) {
    const key = `${p.organizationId}:${p.customerId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({
      organizationId: p.organizationId,
      customerId: p.customerId,
    });
  }
  if (pairs.length === 0) return [];

  const baseUrl = getAppBaseUrl();
  const out: Array<OutstandingForMerchant | null> = await Promise.all(
    pairs.map(async (p): Promise<OutstandingForMerchant | null> => {
      try {
        const conn = getConnectionForOrg(p.organizationId);
        const org = getOrgById(p.organizationId);
        if (!conn || !org) return null;
        const invoices = await listOpenInvoicesForCustomer(
          conn,
          p.customerId,
        );
        if (invoices.length === 0) return null;
        const total = invoices.reduce(
          (s, inv) => s + Math.round((inv.Balance ?? 0) * 100),
          0,
        );
        if (total <= 0) return null;
        const link = getOrCreatePayLink(p.organizationId, p.customerId);
        const customerName = invoices[0]?.CustomerRef?.name ?? null;
        return {
          organizationId: p.organizationId,
          businessName: conn.companyName ?? org.name,
          customerId: p.customerId,
          customerName,
          totalOpenCents: total,
          invoices: invoices.map((inv) => ({
            qboInvoiceId: inv.Id,
            docNumber: inv.DocNumber ?? null,
            txnDate: inv.TxnDate,
            dueDate: inv.DueDate ?? null,
            totalCents: Math.round((inv.TotalAmt ?? 0) * 100),
            balanceCents: Math.round((inv.Balance ?? 0) * 100),
          })),
          payUrl: `${baseUrl}/pay/${link.token}`,
        };
      } catch (err) {
        captureException(err, {
          where: "portal.outstanding",
          organizationId: p.organizationId,
          customerId: p.customerId,
        });
        return null;
      }
    }),
  );

  return out.filter((x): x is OutstandingForMerchant => x !== null);
}

// Like listOutstandingForCustomerEmail but scoped to a single org (for the
// branded merchant portal).
export async function listOutstandingForCustomerEmailInOrg(
  email: string,
  organizationId: number,
): Promise<OutstandingForMerchant | null> {
  const all = await listOutstandingForCustomerEmail(email);
  return all.find((m) => m.organizationId === organizationId) ?? null;
}
