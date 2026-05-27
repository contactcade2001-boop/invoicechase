import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getOrgById } from "@/lib/server/db/organizations";
import { createLinkToken, isPlaidConfigured } from "@/lib/server/plaid/client";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.organizationId || user.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "plaid_not_configured" }, { status: 503 });
  }
  const org = getOrgById(user.organizationId);
  try {
    const out = await createLinkToken({
      userId: user.id,
      businessName: org?.name ?? "Invoice Chase",
    });
    return NextResponse.json({ ok: true, linkToken: out.link_token });
  } catch (err) {
    console.error("[plaid] link-token failed", err);
    return NextResponse.json({ error: "link_token_failed" }, { status: 500 });
  }
}
