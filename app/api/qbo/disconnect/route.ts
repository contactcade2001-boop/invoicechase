import { NextResponse } from "next/server";
import { decryptToken } from "@/lib/server/crypto";
import {
  deleteConnection,
  getActiveConnection,
} from "@/lib/server/db/connections";
import { revokeToken } from "@/lib/server/qbo/oauth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const conn = getActiveConnection();
  if (conn) {
    try {
      await revokeToken(decryptToken(conn.refreshTokenEnc));
    } catch (err) {
      console.error("[qbo] revoke failed (deleting locally anyway)", err);
    }
    deleteConnection(conn.realmId);
  }
  return NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
}
