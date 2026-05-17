import { NextRequest, NextResponse } from "next/server";
import { generateTripPlan } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = (body?.prompt ?? "").toString().trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing 'prompt' in request body" },
        { status: 400 },
      );
    }

    const plan = await generateTripPlan(prompt);
    return NextResponse.json({ plan }, { status: 200 });
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json(
      { error: "Failed to generate trip plan" },
      { status: 500 },
    );
  }
}
