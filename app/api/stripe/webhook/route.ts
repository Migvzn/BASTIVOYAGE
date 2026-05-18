import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const event = verifyWebhookSignature(body, sig);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log("Premium purchased:", {
        sessionId: session.id,
        user_id: session.metadata?.user_id,
        trip_id: session.metadata?.trip_id,
        amount: session.amount_total,
        email: session.customer_details?.email,
      });
      break;
    }
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
