import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const HEALTH_CACHE_SECONDS = 45;

type ServiceStatus = "ok" | "error" | "unconfigured";

export type HealthResponse = {
  fflogs: ServiceStatus;
  supabase: ServiceStatus;
  message?: string;
};

const cache = new Map<string, { body: HealthResponse; expires: number }>();

function getCached(): HealthResponse | null {
  const key = "health";
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.body;
}

function setCached(body: HealthResponse) {
  cache.set("health", { body, expires: Date.now() + HEALTH_CACHE_SECONDS * 1000 });
}

async function checkFflogs(): Promise<ServiceStatus> {
  const clientId = process.env.FFLOGS_CLIENT_ID;
  const clientSecret = process.env.FFLOGS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return "unconfigured";

  try {
    const res = await fetch("https://www.fflogs.com/api/v2/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "query { worldData { expansions { id name } } }",
        variables: {},
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: unknown; errors?: unknown[] };
      if (json.errors?.length) return "error";
      return "ok";
    }
    if (res.status === 401) return "unconfigured";
    return "error";
  } catch {
    return "error";
  }
}

async function checkSupabase(): Promise<ServiceStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "unconfigured";

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    if (error) return "error";
    return "ok";
  } catch {
    return "error";
  }
}

export async function GET() {
  const cached = getCached();
  if (cached) return NextResponse.json(cached, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });

  const [fflogs, supabase] = await Promise.all([checkFflogs(), checkSupabase()]);
  const body: HealthResponse = { fflogs, supabase };
  setCached(body);
  return NextResponse.json(body, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
}
