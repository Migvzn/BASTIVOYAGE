import { NextRequest, NextResponse } from "next/server";
import { generateTripPlan } from "@/lib/ai";
import { airbnbLink } from "@/lib/links";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = (body?.prompt ?? "").toString().trim();
    if (!prompt) {
      return NextResponse.json({ error: "Missing 'prompt' in request body" }, { status: 400 });
    }

    const plan = await generateTripPlan(prompt);

    const airbnb = airbnbLink({
      city: plan.destination,
      checkIn: plan.start_date,
      checkOut: plan.end_date,
      adults: plan.travelers,
    });

    return NextResponse.json(
      {
        plan,
        airbnb_search_link: airbnb.booking_link,
        sources: plan.enrichment,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json({ error: "Failed to generate trip plan" }, { status: 500 });
  }
}
