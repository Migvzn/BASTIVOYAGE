import { NextRequest, NextResponse } from "next/server";
import { readSession, setSessionCookies } from "@/lib/auth";
import { dbInsert, dbSelect, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ trips: [] });
  }
  const { user, accessToken, refreshed } = await readSession(req);
  if (!user || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const trips = await dbSelect("trips", accessToken, {
    select: "id,destination,origin,budget_total,duration_days,summary,created_at,prompt",
    filter: { user_id: `eq.${user.id}` },
    order: { column: "created_at", ascending: false },
    limit: 50,
  });
  const res = NextResponse.json({ trips });
  if (refreshed) setSessionCookies(res, refreshed);
  return res;
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  const { user, accessToken, refreshed } = await readSession(req);
  if (!user || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const plan = body?.plan;
    if (!plan?.destination) {
      return NextResponse.json({ error: "Missing plan" }, { status: 400 });
    }
    const row = await dbInsert("trips", accessToken, {
      user_id: user.id,
      destination: String(plan.destination),
      origin: plan.origin ?? null,
      budget_total: plan.budget_total ?? 0,
      duration_days: plan.duration_days ?? null,
      summary: plan.summary ?? null,
      prompt: body?.prompt ?? null,
      plan,
      airbnb_search_link: body?.airbnb_search_link ?? null,
      sources: body?.sources ?? null,
    });
    const res = NextResponse.json({ trip: row });
    if (refreshed) setSessionCookies(res, refreshed);
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save failed" },
      { status: 500 },
    );
  }
}
