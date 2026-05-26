import "server-only";
import { getJobberConnectionForOrg } from "../db/jobberConnections";
import {
  listOpenInvoicesForClient,
  recordPayment,
  type JobberInvoice,
} from "./client";

export type RecordJobberPaymentResult =
  | {
      ok: true;
      paymentIds: string[];
      appliedCents: number;
      leftoverCents: number;
    }
  | { ok: false; error: string };

// FIFO oldest-due-first, capped at each invoice's outstanding balance.
export async function recordPaymentInJobber(input: {
  organizationId: number;
  customerId: string;
  amountCents: number;
  noteRef: string;
}): Promise<RecordJobberPaymentResult> {
  const conn = getJobberConnectionForOrg(input.organizationId);
  if (!conn) return { ok: false, error: "not_connected" };

  let invoices: JobberInvoice[];
  try {
    invoices = await listOpenInvoicesForClient(conn, input.customerId);
  } catch (err) {
    console.error("[jobber] list invoices failed", err);
    return { ok: false, error: "list_failed" };
  }
  invoices = invoices
    .filter((inv) => (inv.amounts?.balance ?? 0) > 0)
    .sort((a, b) => {
      const da = a.dueDate ?? a.issuedDate ?? "";
      const db = b.dueDate ?? b.issuedDate ?? "";
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
    const dueCents = Math.round((inv.amounts?.balance ?? 0) * 100);
    if (dueCents <= 0) continue;
    const applyCents = Math.min(remaining, dueCents);
    try {
      const result = await recordPayment(conn, {
        invoiceId: inv.id,
        amount: applyCents / 100,
        reference: input.noteRef,
      });
      paymentIds.push(result.paymentId);
      remaining -= applyCents;
    } catch (err) {
      console.error("[jobber] record payment failed", err);
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
