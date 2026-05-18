import { NextRequest, NextResponse } from "next/server";
import { searchHotels } from "@/lib/hotels";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const city = String(body?.city ?? "").trim();
    if (!city) {
      return NextResponse.json({ error: "Missing 'city'" }, { status: 400 });
    }
    const result = await searchHotels({
      city,
      checkIn: body?.checkIn,
      checkOut: body?.checkOut,
      adults: body?.adults,
      nights: body?.nights,
      budgetHint: body?.budgetHint,
      tier: body?.tier,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("hotels route error:", err);
    return NextResponse.json({ error: "Failed to fetch hotels" }, { status: 500 });
  }
}
