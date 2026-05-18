import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, stripeConfigured } from "@/lib/stripe";
import { readSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  try {
    const { user } = await readSession(req);
    const body = await req.json().catch(() => ({}));
    const origin = req.headers.get("origin") ?? `https://${req.headers.get("host") ?? ""}`;
    const tripId = body?.tripId ? String(body.tripId) : undefined;

    const session = await createCheckoutSession({
      successUrl: `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/premium`,
      customerEmail: user?.email,
      metadata: {
        user_id: user?.id ?? "anonymous",
        trip_id: tripId ?? "",
      },
      mode: "payment",
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 },
    );
  }
}
