import { NextRequest, NextResponse } from "next/server";
import { searchTransport } from "@/lib/transport";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const from = String(body?.from ?? "").trim();
    const to = String(body?.to ?? "").trim();
    if (!from || !to) {
      return NextResponse.json({ error: "Missing 'from' or 'to'" }, { status: 400 });
    }
    const result = await searchTransport({ from, to, date: body?.date });
    return NextResponse.json(result);
  } catch (err) {
    console.error("transport route error:", err);
    return NextResponse.json({ error: "Failed to fetch transport" }, { status: 500 });
  }
}
