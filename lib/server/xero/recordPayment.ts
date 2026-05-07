import "server-only";
import { getXeroConnectionForOrg } from "../db/xeroConnections";
import {
  listOpenInvoicesForCustomer,
  recordPayment,
  type XeroInvoice,
} from "./client";
import { parseXeroDate } from "./client";

export type RecordXeroPaymentResult =
  | {
      ok: true;
      paymentIds: string[];
      appliedCents: number;
      leftoverCents: number;
    }
  | { ok: false; error: string };

// Apply a Stripe pay-link amount to the customer's open Xero invoices,
// FIFO oldest-first. Each Xero Payment is bound to a specific invoice, so
// we may post multiple Payments to close out a multi-invoice balance.
export async function recordPaymentInXero(input: {
  organizationId: number;
  customerId: string; // Xero ContactID
  amountCents: number;
  noteRef: string;
}): Promise<RecordXeroPaymentResult> {
  const conn = getXeroConnectionForOrg(input.organizationId);
  if (!conn) return { ok: false, error: "not_connected" };

  let invoices: XeroInvoice[];
  try {
    invoices = await listOpenInvoicesForCustomer(conn, input.customerId);
  } catch (err) {
    console.error("[xero] list open invoices failed", err);
    return { ok: false, error: "list_failed" };
  }
  invoices = invoices
    .filter((inv) => (inv.AmountDue ?? 0) > 0)
    .sort((a, b) => {
      const da = parseXeroDate(a.DueDate ?? a.Date) ?? "";
      const db = parseXeroDate(b.DueDate ?? b.Date) ?? "";
      return da < db ? -1 : da > db ? 1 : 0;
    });

  if (invoices.length === 0) {
    return {
      ok: true,
      paymentIds: [],
      appliedCents: 0,
      leftoverCents: input.amountCents,
    };
  }

  let remaining = input.amountCents;
  const paymentIds: string[] = [];

  for (const inv of invoices) {
    if (remaining <= 0) break;
    const dueCents = Math.round((inv.AmountDue ?? 0) * 100);
    if (dueCents <= 0) continue;
    const applyCents = Math.min(remaining, dueCents);
    try {
      const result = await recordPayment(conn, {
        invoiceId: inv.InvoiceID,
        amount: applyCents / 100,
        reference: input.noteRef,
      });
      paymentIds.push(result.paymentId);
      remaining -= applyCents;
    } catch (err) {
      console.error("[xero] record payment failed", err);
      return { ok: false, error: "record_failed" };
    }
  }

  return {
    ok: true,
    paymentIds,
    appliedCents: input.amountCents - remaining,
    leftoverCents: remaining,
  };
}
