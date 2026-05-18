const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseConfigured(): boolean {
  return Boolean(URL && ANON);
}

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  user: SupabaseUser;
}

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!URL || !ANON) throw new Error("Supabase not configured");
  const headers = new Headers(init.headers);
  headers.set("apikey", ANON);
  headers.set("Content-Type", "application/json");
  return fetch(`${URL}${path}`, { ...init, headers });
}

export async function signUp(email: string, password: string): Promise<SupabaseSession> {
  const res = await authFetch("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.msg ?? json?.error_description ?? "Signup failed");
  return json as SupabaseSession;
}

export async function signIn(email: string, password: string): Promise<SupabaseSession> {
  const res = await authFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.msg ?? json?.error_description ?? "Login failed");
  return json as SupabaseSession;
}

export async function getUser(accessToken: string): Promise<SupabaseUser | null> {
  if (!URL || !ANON) return null;
  try {
    const res = await fetch(`${URL}/auth/v1/user`, {
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as SupabaseUser;
  } catch {
    return null;
  }
}

export async function refreshSession(refreshToken: string): Promise<SupabaseSession | null> {
  try {
    const res = await authFetch("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    return (await res.json()) as SupabaseSession;
  } catch {
    return null;
  }
}

interface QueryOptions {
  select?: string;
  filter?: Record<string, string>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

function buildQuery(opts: QueryOptions = {}): string {
  const params = new URLSearchParams();
  if (opts.select) params.set("select", opts.select);
  if (opts.filter) {
    for (const [k, v] of Object.entries(opts.filter)) params.set(k, v);
  }
  if (opts.order) {
    const dir = opts.order.ascending === false ? "desc" : "asc";
    params.set("order", `${opts.order.column}.${dir}`);
  }
  if (opts.limit) params.set("limit", String(opts.limit));
  return params.toString() ? `?${params.toString()}` : "";
}

export async function dbSelect<T = any>(
  table: string,
  accessToken: string,
  opts?: QueryOptions,
): Promise<T[]> {
  if (!URL || !ANON) return [];
  const res = await fetch(`${URL}/rest/v1/${table}${buildQuery(opts)}`, {
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) return [];
  return (await res.json()) as T[];
}

export async function dbInsert<T = any>(
  table: string,
  accessToken: string,
  row: any,
): Promise<T | null> {
  if (!URL || !ANON) return null;
  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Insert failed: ${res.status} ${text}`);
  }
  const arr = (await res.json()) as T[];
  return arr?.[0] ?? null;
}

export async function dbDelete(
  table: string,
  accessToken: string,
  filter: Record<string, string>,
): Promise<boolean> {
  if (!URL || !ANON) return false;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) params.set(k, v);
  const res = await fetch(`${URL}/rest/v1/${table}?${params}`, {
    method: "DELETE",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.ok;
}

export async function dbUpdate<T = any>(
  table: string,
  accessToken: string,
  filter: Record<string, string>,
  patch: any,
): Promise<T | null> {
  if (!URL || !ANON) return null;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) params.set(k, v);
  const res = await fetch(`${URL}/rest/v1/${table}?${params}`, {
    method: "PATCH",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return null;
  const arr = (await res.json()) as T[];
  return arr?.[0] ?? null;
}

export function serviceRoleKey(): string | null {
  return SERVICE ?? null;
}
