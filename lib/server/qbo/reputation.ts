import "server-only";
import { REPUTATION_MAX, REPUTATION_MIN } from "@/lib/types";
import type { QboInvoice, QboPayment } from "./client";

export type PaymentSignal = {
  customerId: string;
  daysLate: number;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function diffDays(laterIso: string, earlierIso: string): number {
  const later = new Date(laterIso + "T00:00:00Z").getTime();
  const earlier = new Date(earlierIso + "T00:00:00Z").getTime();
  return Math.floor((later - earlier) / MS_PER_DAY);
}

function clamp(score: number): number {
  return Math.max(REPUTATION_MIN, Math.min(REPUTATION_MAX, Math.round(score)));
}

export function collectPaymentSignals(
  paidInvoices: QboInvoice[],
  payments: QboPayment[],
): Map<string, PaymentSignal[]> {
  const invoiceToPaymentDate = new Map<string, string>();
  for (const payment of payments) {
    if (!payment.Line) continue;
    for (const line of payment.Line) {
      if (!line.LinkedTxn) continue;
      for (const link of line.LinkedTxn) {
        if (link.TxnType === "Invoice") {
          const existing = invoiceToPaymentDate.get(link.TxnId);
          if (!existing || payment.TxnDate > existing) {
            invoiceToPaymentDate.set(link.TxnId, payment.TxnDate);
          }
        }
      }
    }
  }

  const byCustomer = new Map<string, PaymentSignal[]>();
  for (const invoice of paidInvoices) {
    if (!invoice.DueDate) continue;
    const paymentDate = invoiceToPaymentDate.get(invoice.Id);
    if (!paymentDate) continue;
    const customerId = invoice.CustomerRef.value;
    const daysLate = diffDays(paymentDate, invoice.DueDate);
    const list = byCustomer.get(customerId) ?? [];
    list.push({ customerId, daysLate });
    byCustomer.set(customerId, list);
  }
  return byCustomer;
}

export function scoreFromHistory(signals: PaymentSignal[]): number {
  const n = signals.length;
  const totalLate = signals.reduce((sum, s) => sum + Math.max(0, s.daysLate), 0);
  const onTime = signals.filter((s) => s.daysLate <= 0).length;
  const avgDaysLate = totalLate / n;
  const onTimeRate = onTime / n;

  // Baseline 750 (Very Good entry).
  // Each average day late costs 4 points.
  // Tenure: up to +60 for 20+ paid invoices in window.
  // Each percentage-point below 100% on-time costs 1 point (capped at -100).
  const score =
    750 -
    avgDaysLate * 4 +
    Math.min(n, 20) * 3 -
    (1 - onTimeRate) * 100;

  return clamp(score);
}

export function scoreFromOpenOnly(oldestDaysLate: number): number {
  if (oldestDaysLate > 60) return 420;
  if (oldestDaysLate > 30) return 555;
  if (oldestDaysLate > 7) return 645;
  if (oldestDaysLate > 0) return 715;
  return 770;
}

const MIN_SIGNALS_FOR_HISTORY_SCORE = 2;

export function reputationFor(
  signals: PaymentSignal[] | undefined,
  oldestDaysLate: number,
): number {
  if (signals && signals.length >= MIN_SIGNALS_FOR_HISTORY_SCORE) {
    return scoreFromHistory(signals);
  }
  return scoreFromOpenOnly(oldestDaysLate);
}
