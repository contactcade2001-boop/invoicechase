import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import {
  findOrgByTwilioPhone,
  getOrgById,
} from "@/lib/server/db/organizations";
import { smsConversations } from "@/lib/server/db/schema";
import { recordInboundAndMaybeReply } from "@/lib/server/sms/autopilot";
import { verifyTwilioSignature } from "@/lib/server/twilio/verify";

export const dynamic = "force-dynamic";

function twiml(body: string): NextResponse {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body}</Response>`,
    {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    },
  );
}

function findOrgIdByConversationHistory(fromPhone: string): number | null {
  const db = getDb();
  const rows = db
    .select()
    .from(smsConversations)
    .where(eq(smsConversations.customerPhone, fromPhone))
    .all();
  if (rows.length === 0) return null;
  rows.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  return rows[0].organizationId;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const formObj: Record<string, string> = {};
  for (const [k, v] of params.entries()) formObj[k] = v;

  const baseUrl =
    process.env.APP_BASE_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;
  const url = `${baseUrl}${req.nextUrl.pathname}`;
  const signature = req.headers.get("x-twilio-signature");

  let verified = false;
  try {
    verified = verifyTwilioSignature({
      signature,
      url,
      params: formObj,
    });
  } catch {
    verified = false;
  }
  if (process.env.NODE_ENV === "production" && !verified) {
    return new NextResponse("invalid signature", { status: 403 });
  }

  const fromPhone = formObj["From"] ?? "";
  const toPhone = formObj["To"] ?? "";
  const body = (formObj["Body"] ?? "").trim();
  const twilioSid = formObj["MessageSid"] ?? null;

  if (!fromPhone || !body) {
    return twiml("");
  }

  // 1) Per-org Twilio number: if the message came in to a number an org
  //    has claimed, that org owns it. The right answer for multi-tenant.
  let org = toPhone ? findOrgByTwilioPhone(toPhone) : null;
  // 2) Fallback: if we've already had a conversation with this customer
  //    on the platform's shared number, route to that org. Lets new
  //    deployments work before any org claims their own number.
  if (!org) {
    const orgId = findOrgIdByConversationHistory(fromPhone);
    if (orgId) org = getOrgById(orgId);
  }
  if (!org) {
    console.warn(
      "[sms-inbound] no org for from=%s to=%s",
      fromPhone,
      toPhone,
    );
    return twiml("");
  }

  try {
    await recordInboundAndMaybeReply({
      org,
      fromPhone,
      body,
      twilioSid,
    });
  } catch (err) {
    console.error("[sms-inbound] handler failed", err);
  }

  return twiml("");
}
