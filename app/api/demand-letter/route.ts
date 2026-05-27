import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getOrgById } from "@/lib/server/db/organizations";
import { generateDemandLetter } from "@/lib/server/recovery/letters";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || user.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    customerName?: string;
    customerAddress?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    amountDollars?: number;
    daysLate?: number;
    workDescription?: string;
    paymentDeadlineDays?: number;
  };
  if (!body.customerName || typeof body.amountDollars !== "number") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const org = getOrgById(user.organizationId);
  const letter = generateDemandLetter({
    businessName: org?.name ?? "Invoice Chase",
    customerName: body.customerName,
    customerAddress: body.customerAddress,
    invoiceNumber: body.invoiceNumber,
    invoiceDate: body.invoiceDate,
    amountCents: Math.round(body.amountDollars * 100),
    daysLate: body.daysLate ?? 0,
    workDescription: body.workDescription,
    paymentDeadlineDays: body.paymentDeadlineDays,
  });
  return new NextResponse(letter.body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="demand-letter-${body.customerName.replace(/\s+/g, "-").toLowerCase()}.txt"`,
    },
  });
}
