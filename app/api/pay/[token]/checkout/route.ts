import { NextResponse, type NextRequest } from "next/server";
import { findPayLinkByToken } from "@/lib/server/db/payLinks";
import { lookupCustomerForOrg } from "@/lib/server/qbo/sync";
import { createPayCheckoutUrl } from "@/lib/server/stripe/payCheckout";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  const back = (qs: string) =>
    NextResponse.redirect(new URL(`/pay/${token}${qs}`, req.url), {
      status: 303,
    });

  const link = findPayLinkByToken(token);
  if (!link || link.expiresAt < Date.now()) {
    return back("?error=start_failed");
  }

  const lookup = await lookupCustomerForOrg(link.organizationId, link.customerId);
  if (!lookup.ok) {
    return back("?error=start_failed");
  }

  try {
    const result = await createPayCheckoutUrl({
      organizationId: link.organizationId,
      token,
      customer: lookup.customer,
      companyName: lookup.companyName,
      amountCentsOverride: link.amountCentsOverride,
    });
    if (!result.ok) {
      console.error("[pay] checkout failed:", result.error);
      return back("?error=start_failed");
    }
    return NextResponse.redirect(result.url, { status: 303 });
  } catch (err) {
    console.error("[pay] checkout threw", err);
    return back("?error=start_failed");
  }
}
