import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getUser, refreshSession, SupabaseSession, SupabaseUser } from "./supabase";

const ACCESS_COOKIE = "sb-access";
const REFRESH_COOKIE = "sb-refresh";

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setSessionCookies(res: NextResponse, session: SupabaseSession) {
  res.cookies.set(ACCESS_COOKIE, session.access_token, {
    ...cookieOpts,
    maxAge: session.expires_in ?? 3600,
  });
  res.cookies.set(REFRESH_COOKIE, session.refresh_token, {
    ...cookieOpts,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { ...cookieOpts, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...cookieOpts, maxAge: 0 });
}

export async function readSession(req: NextRequest): Promise<{
  user: SupabaseUser | null;
  accessToken: string | null;
  refreshed?: SupabaseSession | null;
}> {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (access) {
    const user = await getUser(access);
    if (user) return { user, accessToken: access };
  }
  if (refresh) {
    const refreshed = await refreshSession(refresh);
    if (refreshed) {
      return {
        user: refreshed.user,
        accessToken: refreshed.access_token,
        refreshed,
      };
    }
  }
  return { user: null, accessToken: null };
}

export async function getServerUser(): Promise<{
  user: SupabaseUser | null;
  accessToken: string | null;
}> {
  const c = cookies();
  const access = c.get(ACCESS_COOKIE)?.value;
  if (!access) return { user: null, accessToken: null };
  const user = await getUser(access);
  return { user, accessToken: access };
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
