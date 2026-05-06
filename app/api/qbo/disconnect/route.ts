import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { decryptToken } from "@/lib/server/crypto";
import {
  deleteConnectionForUser,
  getConnectionForUser,
} from "@/lib/server/db/connections";
import { revokeToken } from "@/lib/server/qbo/oauth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }
  const conn = getConnectionForUser(user.id);
  if (conn) {
    try {
      await revokeToken(decryptToken(conn.refreshTokenEnc));
    } catch (err) {
      console.error("[qbo] revoke failed (deleting locally anyway)", err);
    }
    deleteConnectionForUser(user.id, conn.realmId);
  }
  return NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
}
