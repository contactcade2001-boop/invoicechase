import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { removeItem } from "@/lib/server/plaid/client";
import {
  clearPlaidConnection,
  getPlaidConnection,
} from "@/lib/server/plaid/repo";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.organizationId || user.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const conn = getPlaidConnection(user.organizationId);
  if (conn) {
    try {
      await removeItem(conn.accessToken);
    } catch (err) {
      console.warn("[plaid] item/remove failed (continuing to clear local)", err);
    }
  }
  clearPlaidConnection(user.organizationId);
  return NextResponse.json({ ok: true });
}
