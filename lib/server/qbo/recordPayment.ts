import "server-only";
import { getConnectionForUser } from "../db/connections";
import {
  listOpenInvoicesForCustomer,
  qboPost,
  type QboInvoice,
} from "./client";

type QboPaymentLine = {
  Amount: number;
  LinkedTxn: Array<{ TxnId: string; TxnType: "Invoice" }>;
};

function buildLines(
  invoices: QboInvoice[],
  totalDollars: number,
): QboPaymentLine[] {
  const lines: QboPaymentLine[] = [];
  let remaining = totalDollars;
  for (const inv of invoices) {
    if (remaining <= 0) break;
    const applied = Math.min(remaining, inv.Balance);
    if (applied <= 0) continue;
    lines.push({
      Amount: Math.round(applied * 100) / 100,
      LinkedTxn: [{ TxnId: inv.Id, TxnType: "Invoice" }],
    });
    remaining -= applied;
  }
  return lines;
}

export type RecordPaymentInput = {
  userId: number;
  customerId: string;
  amountCents: number;
  noteRef?: string;
};

export type RecordPaymentResult = {
  qboPaymentId: string | null;
  customerName: string | null;
};

export async function recordPaymentInQbo(
  input: RecordPaymentInput,
): Promise<RecordPaymentResult> {
  const conn = getConnectionForUser(input.userId);
  if (!conn) {
    console.warn(
      "[qbo] mark-paid: no QBO connection for user",
      input.userId,
    );
    return { qboPaymentId: null, customerName: null };
  }

  const invoices = await listOpenInvoicesForCustomer(
    conn,
    input.customerId,
  );
  const customerName = invoices[0]?.CustomerRef?.name ?? null;

  const totalDollars = input.amountCents / 100;
  const lines = buildLines(invoices, totalDollars);
  // Surplus (paid > sum of open invoice balances) is intentionally allowed:
  // QBO records the difference as customer credit (UnappliedAmt) when
  // TotalAmt exceeds the sum of Line amounts.

  const body: Record<string, unknown> = {
    CustomerRef: { value: input.customerId },
    TotalAmt: Math.round(totalDollars * 100) / 100,
  };
  if (lines.length > 0) {
    body.Line = lines;
  }
  if (input.noteRef) {
    body.PrivateNote = `Invoice Chase payment: ${input.noteRef}`;
  }

  const result = await qboPost<{ Payment?: { Id?: string } }>(
    conn,
    "/payment",
    body,
  );
  return {
    qboPaymentId: result.Payment?.Id ?? null,
    customerName,
  };
}
