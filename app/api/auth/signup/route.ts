import { NextRequest, NextResponse } from "next/server";
import { signUp, supabaseConfigured } from "@/lib/supabase";
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
    if (!email || password.length < 6) {
      return NextResponse.json(
        { error: "Email + mot de passe ≥ 6 caractères requis" },
        { status: 400 },
      );
    }
    const session = await signUp(email, password);
    const res = NextResponse.json({ user: session.user });
    if (session.access_token) setSessionCookies(res, session);
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Signup failed" },
      { status: 400 },
    );
  }
}
