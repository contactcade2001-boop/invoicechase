import "server-only";

export type DemandLetterInput = {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  customerName: string;
  customerAddress?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  amountCents: number;
  daysLate: number;
  workDescription?: string;
  paymentDeadlineDays?: number;
};

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generate a formal demand letter, ready for printing or attaching to
 * certified mail. Not legal advice — owner should have an attorney review
 * before sending if the balance is significant.
 */
export function generateDemandLetter(input: DemandLetterInput): {
  subject: string;
  body: string;
} {
  const deadlineDays = input.paymentDeadlineDays ?? 10;
  const deadlineDate = new Date(Date.now() + deadlineDays * 86_400_000);
  const today = new Date();

  const subject = `FINAL DEMAND FOR PAYMENT — Invoice ${input.invoiceNumber ?? ""}`.trim();

  const lines: string[] = [];
  lines.push(input.businessName);
  if (input.businessAddress) lines.push(input.businessAddress);
  if (input.businessPhone) lines.push(`Phone: ${input.businessPhone}`);
  if (input.businessEmail) lines.push(`Email: ${input.businessEmail}`);
  lines.push("");
  lines.push(fmtDate(today));
  lines.push("");
  lines.push(input.customerName);
  if (input.customerAddress) lines.push(input.customerAddress);
  lines.push("");
  lines.push(`Re: FINAL DEMAND FOR PAYMENT — ${fmtCurrency(input.amountCents)} OUTSTANDING`);
  lines.push("");
  lines.push(`Dear ${input.customerName.split(" ")[0] || input.customerName},`);
  lines.push("");
  lines.push(
    `This letter constitutes formal demand for payment of the outstanding balance of ${fmtCurrency(input.amountCents)} owed to ${input.businessName}${input.invoiceNumber ? ` under Invoice ${input.invoiceNumber}` : ""}${input.invoiceDate ? `, originally dated ${input.invoiceDate}` : ""}.`,
  );
  lines.push("");
  lines.push(
    `This invoice is currently ${input.daysLate} day${input.daysLate === 1 ? "" : "s"} past due. ${input.workDescription ? `It covers ${input.workDescription}, which was completed in full and accepted without dispute. ` : ""}Despite previous reminders sent by SMS and email, payment has not been received.`,
  );
  lines.push("");
  lines.push(
    `You are hereby notified that payment in full is required within ${deadlineDays} day${deadlineDays === 1 ? "" : "s"} of receipt of this letter — on or before ${fmtDate(deadlineDate)}.`,
  );
  lines.push("");
  lines.push("Failure to remit payment by this deadline may result in:");
  lines.push("");
  lines.push("    1. Filing of a mechanics lien against the project property, where applicable.");
  lines.push("    2. Referral of this account to a third-party collections agency.");
  lines.push("    3. Filing of a small claims or civil court action to recover the amount owed, plus statutory interest, court costs, and attorney's fees as permitted by law.");
  lines.push("    4. Reporting of the unpaid debt to applicable commercial credit bureaus.");
  lines.push("");
  lines.push(
    `To resolve this matter immediately, please remit payment by check, ACH, or via the secure online portal provided in your previous reminders. If you dispute any portion of this balance, you must respond in writing within the deadline above identifying the specific basis for your dispute.`,
  );
  lines.push("");
  lines.push(
    `We would prefer to resolve this without further escalation. Please contact ${input.businessPhone ?? "us"} immediately if you wish to discuss a payment arrangement.`,
  );
  lines.push("");
  lines.push("Sincerely,");
  lines.push("");
  lines.push("");
  lines.push(input.businessName);
  lines.push("");
  lines.push("─────────────────────────────────────────────────────────");
  lines.push(
    "This communication is an attempt to collect a debt. Any information",
  );
  lines.push("obtained will be used for that purpose.");
  lines.push("─────────────────────────────────────────────────────────");

  return { subject, body: lines.join("\n") };
}

/**
 * Build a packet of evidence to file a small-claims complaint. Returns plain
 * text suitable for printing — owner attaches their own invoices/receipts.
 */
export function generateSmallClaimsPacket(input: {
  businessName: string;
  customerName: string;
  amountCents: number;
  invoiceNumber?: string;
  workDescription?: string;
  reminderHistory: { sentAt: number; channel: string }[];
}): string {
  const lines: string[] = [];
  lines.push("SMALL CLAIMS COMPLAINT — EVIDENCE PACKET");
  lines.push("");
  lines.push(`Plaintiff: ${input.businessName}`);
  lines.push(`Defendant: ${input.customerName}`);
  lines.push(`Amount in Controversy: ${fmtCurrency(input.amountCents)}`);
  lines.push(
    `Date Prepared: ${new Date().toLocaleDateString("en-US")}`,
  );
  lines.push("");
  lines.push("STATEMENT OF CLAIM");
  lines.push("------------------");
  lines.push(
    `Plaintiff ${input.businessName} performed services for Defendant ${input.customerName}${input.workDescription ? ` consisting of ${input.workDescription}` : ""}${input.invoiceNumber ? `, invoiced under Invoice ${input.invoiceNumber}` : ""}. The work was completed and accepted. Defendant has failed to pay the agreed-upon amount of ${fmtCurrency(input.amountCents)} despite repeated written reminders.`,
  );
  lines.push("");
  lines.push("COMMUNICATION HISTORY");
  lines.push("---------------------");
  if (input.reminderHistory.length === 0) {
    lines.push("(no recorded reminders)");
  } else {
    for (const r of input.reminderHistory) {
      lines.push(
        `${new Date(r.sentAt).toLocaleDateString("en-US")} — Reminder sent via ${r.channel}`,
      );
    }
  }
  lines.push("");
  lines.push("PRAYER FOR RELIEF");
  lines.push("-----------------");
  lines.push(
    `Plaintiff respectfully requests judgment against Defendant in the amount of ${fmtCurrency(input.amountCents)}, plus pre- and post-judgment interest at the statutory rate, plus court costs and any other relief the Court deems just and proper.`,
  );
  lines.push("");
  lines.push("ATTACHMENTS");
  lines.push("-----------");
  lines.push("  □ Signed invoice or contract");
  lines.push("  □ Proof of work completed (photos, receipts, etc.)");
  lines.push("  □ Communication logs (attach SMS / email reminders)");
  lines.push("  □ Demand letter and proof of certified delivery, if sent");
  lines.push("");
  lines.push(
    "This packet is prepared as a starting point. File the appropriate small-claims complaint form for your county. Consult a licensed attorney if the amount exceeds your jurisdiction's small-claims limit.",
  );
  return lines.join("\n");
}
