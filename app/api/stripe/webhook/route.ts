import { NextResponse, type NextRequest } from "next/server";
import { constructEvent, handleEvent } from "@/lib/server/stripe/webhook";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }
  const rawBody = await req.text();
  let event;
  try {
    event = await constructEvent(rawBody, signature);
  } catch (err) {
    console.error("[stripe] webhook signature failed", err);
    return new NextResponse("Bad signature", { status: 400 });
  }
  try {
    await handleEvent(event);
  } catch (err) {
    console.error("[stripe] webhook handler failed", err);
    return new NextResponse("Handler error", { status: 500 });
  }
  return NextResponse.json({ received: true });
}
