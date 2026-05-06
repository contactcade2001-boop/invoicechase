import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import {
  getConnectAccountByStripeId,
} from "@/lib/server/db/connect";
import { getSubscriptionByStripeCustomerId } from "@/lib/server/db/subscriptions";
import {
  isAlreadyProcessed,
  logWebhookEvent,
} from "@/lib/server/db/webhookEvents";
import { constructEvent, handleEvent } from "@/lib/server/stripe/webhook";

export const dynamic = "force-dynamic";

function intMeta(
  meta: Stripe.Metadata | null | undefined,
  key: string,
): number | null {
  const raw = meta?.[key];
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

// Best-effort: pull an organizationId out of common Stripe event shapes so the
// log row is queryable by owner.
function resolveOrgId(event: Stripe.Event): number | null {
  const obj = event.data.object as unknown as {
    metadata?: Stripe.Metadata | null;
  };
  const fromMeta = intMeta(obj.metadata, "organizationId");
  if (fromMeta) return fromMeta;
  // Subscription / Connect events: look up by Stripe customer / account ID.
  if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as Stripe.Subscription;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (customerId) {
      return getSubscriptionByStripeCustomerId(customerId)?.organizationId ?? null;
    }
  }
  if (event.type === "account.updated") {
    const acct = event.data.object as Stripe.Account;
    return getConnectAccountByStripeId(acct.id)?.organizationId ?? null;
  }
  return null;
}

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

  const organizationId = resolveOrgId(event);

  // Idempotency: Stripe may retry the same event_id.
  if (isAlreadyProcessed("stripe", event.id)) {
    logWebhookEvent({
      source: "stripe",
      organizationId,
      eventId: event.id,
      type: event.type,
      status: "ignored",
      errorMessage: "duplicate",
    });
    return NextResponse.json({ received: true, ignored: true });
  }

  logWebhookEvent({
    source: "stripe",
    organizationId,
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
      organizationId,
      eventId: event.id,
      type: event.type,
      status: "errored",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return new NextResponse("Handler error", { status: 500 });
  }

  logWebhookEvent({
    source: "stripe",
    organizationId,
    eventId: event.id,
    type: event.type,
    status: "processed",
  });
  return NextResponse.json({ received: true });
}
