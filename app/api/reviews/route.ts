import { NextRequest, NextResponse } from "next/server";
import { getReviews } from "@/lib/reviews";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
    }
    const result = await getReviews({ name, city: body?.city });
    return NextResponse.json(result);
  } catch (err) {
    console.error("reviews route error:", err);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
