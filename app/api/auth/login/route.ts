import { NextRequest, NextResponse } from "next/server";
import { signIn, supabaseConfigured } from "@/lib/supabase";
import { setSessionCookies } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "");
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }
    const session = await signIn(email, password);
    const res = NextResponse.json({ user: session.user });
    setSessionCookies(res, session);
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Login failed" },
      { status: 401 },
    );
  }
}
