/**
 * POST /api/flowise/document-store/vectorstore/query
 * Proxies to Flowise retrieval query for upserted chunks.
 * Body: { storeId: string, query: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flowiseFetch } from "@/lib/flowise/client";
import { decryptFlowiseApiKey } from "@/lib/flowise/profile-api-key";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { storeId, query } = body as { storeId?: string; query?: string };
  if (!storeId || typeof query !== "string") {
    return NextResponse.json(
      { error: "storeId and query are required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("flowise_api_key_encrypted")
    .eq("id", user.id)
    .single();

  let userApiKey: string | null = null;
  if (profile?.flowise_api_key_encrypted) {
    try {
      userApiKey = decryptFlowiseApiKey(profile.flowise_api_key_encrypted);
    } catch {
      // use system key
    }
  }

  const res = await flowiseFetch(
    "document-store/vectorstore/query",
    { method: "POST", body: { storeId, query } },
    userApiKey,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { message?: string })?.message ?? "Query failed" },
      { status: res.status },
    );
  }
  return NextResponse.json(data);
}
