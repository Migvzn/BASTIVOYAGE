import { NextRequest, NextResponse } from "next/server";
import { readSession, setSessionCookies } from "@/lib/auth";
import { dbDelete, dbSelect, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  const { user, accessToken, refreshed } = await readSession(req);
  if (!user || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const trips = await dbSelect("trips", accessToken, {
    filter: { id: `eq.${params.id}`, user_id: `eq.${user.id}` },
    limit: 1,
  });
  if (!trips[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const res = NextResponse.json({ trip: trips[0] });
  if (refreshed) setSessionCookies(res, refreshed);
  return res;
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  const { user, accessToken, refreshed } = await readSession(req);
  if (!user || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ok = await dbDelete("trips", accessToken, {
    id: `eq.${params.id}`,
    user_id: `eq.${user.id}`,
  });
  const res = NextResponse.json({ ok });
  if (refreshed) setSessionCookies(res, refreshed);
  return res;
}
