import { NextRequest, NextResponse } from "next/server";
import { readSession, setSessionCookies } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { user, refreshed } = await readSession(req);
  const res = NextResponse.json({ user });
  if (refreshed) setSessionCookies(res, refreshed);
  return res;
}
