import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/flights";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const origin = String(body?.origin ?? "").trim();
    const destination = String(body?.destination ?? "").trim();
    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Missing 'origin' or 'destination'" },
        { status: 400 },
      );
    }
    const result = await searchFlights({
      origin,
      destination,
      departDate: body?.departDate,
      returnDate: body?.returnDate,
      adults: body?.adults,
      budgetHint: body?.budgetHint,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("flights route error:", err);
    return NextResponse.json({ error: "Failed to fetch flights" }, { status: 500 });
  }
}
