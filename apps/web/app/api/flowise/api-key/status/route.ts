/**
 * GET /api/flowise/api-key/status
 * Returns whether the current user has a stored Flowise API key and last verified time.
 * Key value is never returned.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("flowise_api_key_encrypted, flowise_api_key_verified_at")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hasKey = !!data?.flowise_api_key_encrypted;
  return NextResponse.json({
    hasKey,
    verifiedAt: hasKey ? data?.flowise_api_key_verified_at ?? null : null,
  });
}
