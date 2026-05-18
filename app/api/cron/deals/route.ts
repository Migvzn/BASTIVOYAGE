import { NextRequest, NextResponse } from "next/server";
import { buildAllDeals } from "@/lib/deals";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const deals = await buildAllDeals();
    return NextResponse.json({
      count: deals.length,
      generated_at: new Date().toISOString(),
      cheapest: deals[0]?.route.slug,
    });
  } catch (err) {
    console.error("cron/deals error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
