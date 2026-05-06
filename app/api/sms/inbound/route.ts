import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { getOrgById } from "@/lib/server/db/organizations";
import {
  smsConversations,
} from "@/lib/server/db/schema";
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

function findOrgIdForFromPhone(fromPhone: string): number | null {
  const db = getDb();
  const row = db
    .select()
    .from(smsConversations)
    .where(eq(smsConversations.customerPhone, fromPhone))
    .all();
  if (row.length === 0) return null;
  // Most recent conversation wins.
  row.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  return row[0].organizationId;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const formObj: Record<string, string> = {};
  for (const [k, v] of params.entries()) formObj[k] = v;

  // Twilio sends X-Forwarded-Proto so we have to reconstruct the URL it
  // signed. APP_BASE_URL is the canonical public URL we configured Twilio
  // to point at.
  const baseUrl =
    process.env.APP_BASE_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;
  const url = `${baseUrl}${req.nextUrl.pathname}`;
  const signature = req.headers.get("x-twilio-signature");

  // Skip verification when no auth token is configured (dev / tests).
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
  const body = (formObj["Body"] ?? "").trim();
  const twilioSid = formObj["MessageSid"] ?? null;

  if (!fromPhone || !body) {
    return twiml("");
  }

  const orgId = findOrgIdForFromPhone(fromPhone);
  if (!orgId) {
    console.warn("[sms-inbound] no org for phone", fromPhone);
    return twiml("");
  }
  const org = getOrgById(orgId);
  if (!org) return twiml("");

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

  // Reply with empty TwiML — we send any reply ourselves via the Twilio REST
  // API so it shows up in the same conversation thread.
  return twiml("");
}
