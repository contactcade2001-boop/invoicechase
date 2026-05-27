import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { organizations } from "@/lib/server/db/schema";
import {
  fetchBalances,
  sumDepositoryBalanceCents,
} from "@/lib/server/plaid/client";
import {
  getPlaidConnection,
  setBankBalance,
} from "@/lib/server/plaid/repo";

export const dynamic = "force-dynamic";

type WebhookBody = {
  webhook_type?: string;
  webhook_code?: string;
  item_id?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as WebhookBody;
  if (!body.item_id) {
    return NextResponse.json({ ok: true });
  }
  // Find the org with this item_id.
  const db = getDb();
  const org = db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.plaidItemId, body.item_id))
    .get();
  if (!org) {
    return NextResponse.json({ ok: true });
  }
  // Only refresh on balance-related notifications.
  if (
    body.webhook_type === "TRANSACTIONS" ||
    body.webhook_type === "ITEM" ||
    body.webhook_code === "DEFAULT_UPDATE" ||
    body.webhook_code === "HISTORICAL_UPDATE"
  ) {
    const conn = getPlaidConnection(org.id);
    if (conn) {
      try {
        const balances = await fetchBalances(conn.accessToken);
        const cents = sumDepositoryBalanceCents(balances.accounts);
        setBankBalance(org.id, cents);
      } catch (err) {
        console.warn("[plaid] webhook refresh failed", err);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
