import "server-only";
import { getConnectionForOrg } from "../db/connections";
import { getOrgById } from "../db/organizations";
import { qboPost } from "./client";

export type CreateRefundReceiptInput = {
  organizationId: number;
  customerId: string;
  amountCents: number;
  noteRef?: string;
};

export type CreateRefundReceiptResult =
  | { ok: true; refundReceiptId: string }
  | { ok: false; error: string };

export async function createQboRefundReceipt(
  input: CreateRefundReceiptInput,
): Promise<CreateRefundReceiptResult> {
  const org = getOrgById(input.organizationId);
  if (!org) return { ok: false, error: "no_org" };
  const depositToId = org.qboDepositToAccountId;
  const itemId = org.qboRefundItemId;
  if (!depositToId || !itemId) {
    return { ok: false, error: "accounts_not_configured" };
  }
  const conn = getConnectionForOrg(input.organizationId);
  if (!conn) return { ok: false, error: "no_connection" };

  const totalDollars =
    Math.round((input.amountCents / 100) * 100) / 100;
  const body: Record<string, unknown> = {
    CustomerRef: { value: input.customerId },
    TotalAmt: totalDollars,
    DepositToAccountRef: { value: depositToId },
    Line: [
      {
        Amount: totalDollars,
        DetailType: "SalesItemLineDetail",
        SalesItemLineDetail: {
          ItemRef: { value: itemId },
          Qty: 1,
          UnitPrice: totalDollars,
        },
      },
    ],
  };
  if (input.noteRef) {
    body.PrivateNote = `Invoice Chase refund: ${input.noteRef}`;
  }

  try {
    const res = await qboPost<{ RefundReceipt?: { Id?: string } }>(
      conn,
      "/refundreceipt",
      body,
    );
    const id = res.RefundReceipt?.Id;
    if (!id) return { ok: false, error: "no_id_returned" };
    return { ok: true, refundReceiptId: id };
  } catch (err) {
    console.error("[qbo] refundreceipt create failed", err);
    return { ok: false, error: "post_failed" };
  }
}
