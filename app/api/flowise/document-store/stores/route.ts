/**
 * GET /api/flowise/document-store/stores
 * Proxies to Flowise list document stores. Uses current user's Flowise API key if set, else system key.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flowiseFetch } from "@/lib/flowise/client";
import { decryptFlowiseApiKey } from "@/lib/flowise/profile-api-key";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const res = await flowiseFetch("document-store/store", { method: "GET" }, userApiKey);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { message?: string })?.message ?? "Failed to list document stores" },
      { status: res.status },
    );
  }
  return NextResponse.json(data);
}
