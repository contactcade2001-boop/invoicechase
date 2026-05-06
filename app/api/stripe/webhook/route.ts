import { NextResponse, type NextRequest } from "next/server";
import {
  isAlreadyProcessed,
  logWebhookEvent,
} from "@/lib/server/db/webhookEvents";
import { constructEvent, handleEvent } from "@/lib/server/stripe/webhook";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    logWebhookEvent({
      source: "stripe",
      status: "rejected",
      errorMessage: "missing_signature",
    });
    return new NextResponse("Missing signature", { status: 400 });
  }
  const rawBody = await req.text();
  let event;
  try {
    event = await constructEvent(rawBody, signature);
  } catch (err) {
    console.error("[stripe] webhook signature failed", err);
    logWebhookEvent({
      source: "stripe",
      status: "rejected",
      errorMessage: "bad_signature",
      payload: rawBody,
    });
    return new NextResponse("Bad signature", { status: 400 });
  }

  // Idempotency: Stripe may retry the same event_id.
  if (isAlreadyProcessed("stripe", event.id)) {
    logWebhookEvent({
      source: "stripe",
      eventId: event.id,
      type: event.type,
      status: "ignored",
      errorMessage: "duplicate",
    });
    return NextResponse.json({ received: true, ignored: true });
  }

  logWebhookEvent({
    source: "stripe",
    eventId: event.id,
    type: event.type,
    status: "received",
    payload: rawBody,
  });

  try {
    await handleEvent(event);
  } catch (err) {
    console.error("[stripe] webhook handler failed", err);
    logWebhookEvent({
      source: "stripe",
      eventId: event.id,
      type: event.type,
      status: "errored",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return new NextResponse("Handler error", { status: 500 });
  }

  logWebhookEvent({
    source: "stripe",
    eventId: event.id,
    type: event.type,
    status: "processed",
  });
  return NextResponse.json({ received: true });
}
