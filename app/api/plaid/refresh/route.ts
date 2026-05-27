import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  fetchBalances,
  sumDepositoryBalanceCents,
} from "@/lib/server/plaid/client";
import {
  getPlaidConnection,
  setBankBalance,
} from "@/lib/server/plaid/repo";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const conn = getPlaidConnection(user.organizationId);
  if (!conn) {
    return NextResponse.json({ error: "not_connected" }, { status: 400 });
  }
  try {
    const balances = await fetchBalances(conn.accessToken);
    const cents = sumDepositoryBalanceCents(balances.accounts);
    setBankBalance(user.organizationId, cents);
    return NextResponse.json({ ok: true, balanceCents: cents });
  } catch (err) {
    console.error("[plaid] refresh failed", err);
    return NextResponse.json({ error: "refresh_failed" }, { status: 500 });
  }
}
