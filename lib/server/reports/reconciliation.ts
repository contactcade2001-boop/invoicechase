import "server-only";
import { and, eq, gte, lt } from "drizzle-orm";
import { getDb } from "../db/client";
import { payments } from "../db/schema";
import { csvLine } from "./csv";

export function monthBounds(year: number, monthZeroBased: number) {
  const startMs = Date.UTC(year, monthZeroBased, 1);
  const endMs = Date.UTC(year, monthZeroBased + 1, 1);
  return { startMs, endMs };
}

export function buildReconciliationCsv(input: {
  organizationId: number;
  startMs: number;
  endMs: number;
}): string {
  const rows = getDb()
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, input.organizationId),
        gte(payments.paidAt, input.startMs),
        lt(payments.paidAt, input.endMs),
      ),
    )
    .all();

  const lines: string[] = [];
  lines.push(
    csvLine([
      "Period start",
      new Date(input.startMs).toISOString().slice(0, 10),
      "Period end",
      new Date(input.endMs - 1).toISOString().slice(0, 10),
    ]),
  );
  lines.push("");
  lines.push(
    csvLine([
      "Paid date",
      "Customer",
      "Customer email",
      "Status",
      "Gross",
      "Application fee (1.9%)",
      "Refunded",
      "Net to merchant",
      "Stripe payment intent",
      "Stripe checkout session",
      "QBO payment id",
    ]),
  );

  let gross = 0;
  let fees = 0;
  let refunds = 0;
  for (const p of rows) {
    const refunded = p.refundedAmountCents ?? 0;
    const fee = p.applicationFeeCents ?? 0;
    const net = p.amountCents - refunded - fee;
    if (p.status === "succeeded") {
      gross += p.amountCents;
      fees += fee;
      refunds += refunded;
    }
    lines.push(
      csvLine([
        p.paidAt ? new Date(p.paidAt).toISOString().slice(0, 10) : "",
        p.customerName ?? "",
        p.customerEmail ?? "",
        p.status,
        (p.amountCents / 100).toFixed(2),
        (fee / 100).toFixed(2),
        (refunded / 100).toFixed(2),
        (net / 100).toFixed(2),
        p.stripePaymentIntentId ?? "",
        p.stripeCheckoutSessionId ?? "",
        p.qboPaymentId ?? "",
      ]),
    );
  }

  lines.push("");
  lines.push(csvLine(["Totals (succeeded only)"]));
  lines.push(csvLine(["Gross", (gross / 100).toFixed(2)]));
  lines.push(csvLine(["Application fees", (fees / 100).toFixed(2)]));
  lines.push(csvLine(["Refunds", (refunds / 100).toFixed(2)]));
  lines.push(
    csvLine(["Net to merchant", ((gross - fees - refunds) / 100).toFixed(2)]),
  );
  return lines.join("\r\n") + "\r\n";
}
