/**
 * POST /api/flowise/document-store/refresh/[id]
 * Proxies to Flowise re-process and upsert all documents in store.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flowiseFetch } from "@/lib/flowise/client";
import { decryptFlowiseApiKey } from "@/lib/flowise/profile-api-key";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Store id required" }, { status: 400 });
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

  const body = await request.json().catch(() => ({}));
  const res = await flowiseFetch(
    `document-store/refresh/${id}`,
    { method: "POST", body: typeof body === "object" ? body : {} },
    userApiKey,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { message?: string })?.message ?? "Refresh failed" },
      { status: res.status },
    );
  }
  return NextResponse.json(data);
}
