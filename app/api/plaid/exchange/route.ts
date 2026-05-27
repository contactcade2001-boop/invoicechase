import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  exchangePublicToken,
  fetchBalances,
  fetchInstitution,
  sumDepositoryBalanceCents,
} from "@/lib/server/plaid/client";
import {
  savePlaidConnection,
  setBankBalance,
} from "@/lib/server/plaid/repo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || user.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    publicToken?: string;
  };
  if (!body.publicToken) {
    return NextResponse.json({ error: "missing_public_token" }, { status: 400 });
  }
  try {
    const exchange = await exchangePublicToken(body.publicToken);
    const balances = await fetchBalances(exchange.access_token);

    let institutionName: string | null = null;
    const instId = balances.item?.institution_id;
    if (instId) {
      try {
        const inst = await fetchInstitution(instId);
        institutionName = inst.institution.name;
      } catch (err) {
        console.warn("[plaid] institution lookup failed", err);
      }
    }

    savePlaidConnection(user.organizationId, {
      itemId: exchange.item_id,
      accessToken: exchange.access_token,
      institutionName,
    });
    const cents = sumDepositoryBalanceCents(balances.accounts);
    setBankBalance(user.organizationId, cents);
    return NextResponse.json({
      ok: true,
      institutionName,
      balanceCents: cents,
    });
  } catch (err) {
    console.error("[plaid] exchange failed", err);
    return NextResponse.json({ error: "exchange_failed" }, { status: 500 });
  }
}
