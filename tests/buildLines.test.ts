import { describe, expect, it } from "vitest";
import { buildLines } from "@/lib/server/qbo/recordPayment";
import type { QboInvoice } from "@/lib/server/qbo/client";

const inv = (Id: string, Balance: number, TxnDate: string): QboInvoice => ({
  Id,
  CustomerRef: { value: "c" },
  Balance,
  TotalAmt: Balance,
  TxnDate,
});

const sample = [
  inv("1001", 1500, "2026-01-01"),
  inv("1002", 2000, "2026-02-01"),
  inv("1003", 800, "2026-03-01"),
];

describe("buildLines (FIFO allocation)", () => {
  it("applies a partial first invoice", () => {
    const lines = buildLines(sample, 1000);
    expect(lines).toEqual([
      { Amount: 1000, LinkedTxn: [{ TxnId: "1001", TxnType: "Invoice" }] },
    ]);
  });

  it("walks invoices oldest-first until amount is exhausted", () => {
    const lines = buildLines(sample, 3500);
    expect(lines).toEqual([
      { Amount: 1500, LinkedTxn: [{ TxnId: "1001", TxnType: "Invoice" }] },
      { Amount: 2000, LinkedTxn: [{ TxnId: "1002", TxnType: "Invoice" }] },
    ]);
  });

  it("covers all invoices when amount equals their sum", () => {
    const lines = buildLines(sample, 4300);
    expect(lines).toHaveLength(3);
    expect(lines.map((l) => l.Amount)).toEqual([1500, 2000, 800]);
  });

  it("caps allocation at invoice balances when paid > sum (surplus dropped from Lines)", () => {
    const lines = buildLines(sample, 10000);
    expect(lines.map((l) => l.Amount)).toEqual([1500, 2000, 800]);
  });

  it("returns no lines when there are no invoices", () => {
    expect(buildLines([], 500)).toEqual([]);
  });

  it("returns no lines when amount is zero", () => {
    expect(buildLines(sample, 0)).toEqual([]);
  });
});
