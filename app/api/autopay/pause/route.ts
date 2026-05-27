import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  removeAutopayMethod,
  setAutopayPaused,
} from "@/lib/server/db/autopay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || (user.role !== "owner" && user.role !== "manager")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    customerId?: string;
    action?: "pause" | "resume" | "remove";
  };
  if (!body.customerId || !body.action) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (body.action === "remove") {
    removeAutopayMethod(user.organizationId, body.customerId);
  } else {
    setAutopayPaused(
      user.organizationId,
      body.customerId,
      body.action === "pause",
    );
  }
  return NextResponse.json({ ok: true });
}
