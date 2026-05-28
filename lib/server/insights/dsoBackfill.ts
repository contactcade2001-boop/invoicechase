import "server-only";
import { getConnectionForOrg } from "../db/connections";
import { recordPaidInvoice } from "../db/paidInvoices";
import {
  listPaidInvoicesSince,
  listPaymentsSince,
  type QboInvoice,
  type QboPayment,
} from "../qbo/client";
import { ensureBaselineDso } from "./dso";
import { type PaymentEvent } from "./dsoMath";

const BASELINE_WINDOW_DAYS = 90;

function toMs(iso: string): number {
  // QBO TxnDate is "YYYY-MM-DD" — interpret as UTC midnight.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return Date.parse(`${iso}T00:00:00Z`);
  }
  return Date.parse(iso);
}

/**
 * On QBO connect, pull recent paid invoices + their corresponding payments,
 * insert one paid_invoices row per (invoice, payment) pair, and capture
 * the baseline DSO snapshot. Idempotent — the paid_invoices unique index
 * dedupes on (org, source, invoiceId, installment).
 *
 * Strategy:
 *  - listPaidInvoicesSince gives us invoices with Balance = 0 in the
 *    window (i.e. fully closed).
 *  - listPaymentsSince gives us payment txns with LinkedTxn pointing back
 *    to the invoices. Multiple payment lines on one invoice ⇒ multiple
 *    installments.
 *  - For each payment row, we look up its LinkedTxn invoice issuedAt and
 *    record one paid_invoices row.
 */
export async function backfillBaselineDsoForOrg(
  organizationId: number,
): Promise<{
  invoicesIngested: number;
  baselineDsoDays: number;
}> {
  const conn = getConnectionForOrg(organizationId);
  if (!conn) {
    return { invoicesIngested: 0, baselineDsoDays: 0 };
  }
  const sinceMs = Date.now() - BASELINE_WINDOW_DAYS * 86_400_000;
  const sinceIso = new Date(sinceMs).toISOString().slice(0, 10);

  let paidInvs: QboInvoice[] = [];
  let pays: QboPayment[] = [];
  try {
    paidInvs = await listPaidInvoicesSince(conn, sinceIso);
    pays = await listPaymentsSince(conn, sinceIso);
  } catch (err) {
    console.warn("[dso-backfill] qbo fetch failed", err);
    return { invoicesIngested: 0, baselineDsoDays: 0 };
  }

  // Index invoices by id for quick lookup when iterating payments.
  const invById = new Map<string, QboInvoice>();
  for (const inv of paidInvs) invById.set(inv.Id, inv);

  const events: PaymentEvent[] = [];
  let inserted = 0;

  for (const pay of pays) {
    const customerId = pay.CustomerRef.value;
    const paidAt = toMs(pay.TxnDate);
    const lines = pay.Line ?? [];
    // Each LinkedTxn line represents one invoice settlement event.
    let installmentSeq = new Map<string, number>();
    for (const line of lines) {
      const linked = line.LinkedTxn?.find((l) => l.TxnType === "Invoice");
      if (!linked) continue;
      const inv = invById.get(linked.TxnId);
      if (!inv) continue;
      const amount = Math.round((line.Amount ?? 0) * 100);
      if (amount <= 0) continue;
      const issuedAt = toMs(inv.TxnDate);
      if (paidAt < issuedAt) continue;

      const prior = installmentSeq.get(linked.TxnId) ?? 0;
      const installmentNumber = prior + 1;
      installmentSeq.set(linked.TxnId, installmentNumber);

      const res = recordPaidInvoice({
        organizationId,
        customerId,
        sourceInvoiceId: linked.TxnId,
        installmentNumber,
        source: "qbo",
        issuedAt,
        paidAt,
        amountCents: amount,
      });
      if (res.ok) {
        if (res.inserted) inserted += 1;
        events.push({ issuedAt, paidAt, amountCents: amount });
      }
    }
  }

  const snapshot = ensureBaselineDso(
    organizationId,
    events,
    BASELINE_WINDOW_DAYS,
  );
  return {
    invoicesIngested: inserted,
    baselineDsoDays: snapshot.dsoDays,
  };
}
